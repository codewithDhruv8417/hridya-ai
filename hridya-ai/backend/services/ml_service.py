"""Loads the trained screening model and turns an API payload into a prediction.

Why a service instead of code inside the router?
------------------------------------------------
1. The model is loaded **once** at startup, not on every request (loading a
   1 MB joblib + 100 XGBoost trees takes real time).
2. Routers stay thin: they validate input, call `ml_service.predict(...)`, and
   persist the result.
3. The class is easy to unit test with a fake payload.

The model contract (discovered from the artifact itself)
--------------------------------------------------------
* `XGBClassifier`, 4 output classes [0, 1, 2, 3]
* 17 features, and because it was trained on a DataFrame it stored the exact
  feature names and their order in `feature_names_in_`.
* Mis-ordered or renamed columns raise a feature-name error in XGBoost, so we
  always rebuild the row in `feature_names_in_` order.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from config import settings

logger = logging.getLogger(__name__)


class ModelNotLoadedError(RuntimeError):
    """Raised when /prediction is called but the model failed to load."""


@dataclass(frozen=True)
class FeatureSpec:
    """One column of the model input, described in feature_schema.json."""

    api_name: str
    model_name: str
    label: str
    kind: str  # "number" | "category"
    default: Any
    categories: tuple[str, ...] = ()
    minimum: float | None = None
    maximum: float | None = None
    description: str = ""


@dataclass
class PredictionResult:
    """Everything the API needs from one inference call."""

    predicted_class: int
    predicted_category: str
    confidence: float
    probabilities: dict[str, float]
    expected_severity: float
    risk_level: str
    risk_score: float
    drivers: list[dict] = field(default_factory=list)
    feature_values: dict[str, Any] = field(default_factory=dict)
    encoded_row: dict[str, float] = field(default_factory=dict)


class MLService:
    """Holds the model, the schema, and the encoding rules."""

    def __init__(
        self,
        model_path: str | None = None,
        schema_path: str | None = None,
        encoder_bundle_path: str | None = None,
    ) -> None:
        self.model_path = Path(model_path or settings.model_path)
        self.schema_path = Path(schema_path or settings.feature_schema_path)
        self.encoder_bundle_path = Path(encoder_bundle_path or settings.encoder_bundle_path)

        self._model: Any | None = None
        self._schema: dict[str, Any] = {}
        self._specs: dict[str, FeatureSpec] = {}         # keyed by model feature name
        self._specs_by_api: dict[str, FeatureSpec] = {}  # keyed by API field name
        self._model_features: list[str] = []
        self._label_encoders: dict[str, Any] = {}
        self._category_codes: dict[str, dict[str, int]] = {}
        self._default_codes: dict[str, int] = {}
        self._importances: dict[str, float] = {}
        self._loaded = False
        self._encoding_source = "schema"

    # ------------------------------------------------------------------ load
    def load(self) -> None:
        """Read the artifact and schema from disk. Called from app lifespan."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Screening model not found at {self.model_path}. "
                "Copy hridya_screening_model.joblib into backend/ml_models/."
            )

        self._schema = json.loads(self.schema_path.read_text(encoding="utf-8"))
        self._model = joblib.load(self.model_path)

        for raw in self._schema["features"]:
            spec = FeatureSpec(
                api_name=raw["api_name"],
                model_name=raw["model_name"],
                label=raw.get("label", raw["model_name"]),
                kind=raw["kind"],
                default=raw["default"],
                categories=tuple(raw.get("categories", ())),
                minimum=raw.get("min"),
                maximum=raw.get("max"),
                description=raw.get("description", ""),
            )
            self._specs[spec.model_name] = spec
            self._specs_by_api[spec.api_name] = spec

        # The artifact is the source of truth for order.
        model_features = [str(name) for name in getattr(self._model, "feature_names_in_", [])]
        if not model_features:
            model_features = [spec.model_name for spec in self._specs.values()]
        for name in model_features:
            if name not in self._specs:
                raise ValueError(f"feature_schema.json is missing the model column {name!r}")

        self._model_features = model_features
        self._importances = dict(
            zip(model_features, (float(v) for v in getattr(self._model, "feature_importances_", [0.0] * len(model_features))))
        )

        self._load_encoders()
        self._loaded = True
        logger.info(
            "Loaded screening model %s with %d features, classes=%s, encoding=%s",
            self.model_path.name,
            len(self._model_features),
            list(getattr(self._model, "classes_", [])),
            self._encoding_source,
        )

    def _load_encoders(self) -> None:
        """Prefer the exact training encoders, otherwise rebuild alphabetical codes."""
        if self.encoder_bundle_path.exists():
            bundle = joblib.load(self.encoder_bundle_path)
            self._label_encoders = dict(bundle.get("encoders", {}))
            self._encoding_source = "training-bundle"

        for name, spec in self._specs.items():
            if name in self._label_encoders:
                encoder = self._label_encoders[name]
                try:
                    self._default_codes[name] = int(encoder.transform([spec.default])[0])
                except ValueError:
                    self._default_codes[name] = 0
                continue

            if spec.kind == "category":
                # sklearn's LabelEncoder sorts categories, so index == code.
                ordered = sorted({str(c) for c in spec.categories})
                mapping = {value.casefold(): index for index, value in enumerate(ordered)}
                self._category_codes[name] = mapping
                self._default_codes[name] = mapping.get(str(spec.default).casefold(), 0)
            else:
                self._default_codes[name] = 0

    # -------------------------------------------------------------- encoding
    def _encode_category(self, name: str, value: Any) -> float:
        text = str(value).strip()
        encoder = self._label_encoders.get(name)

        if encoder is not None:
            try:
                return float(encoder.transform([text])[0])
            except ValueError:
                logger.warning("Unseen category %r for %s; using default", text, name)
                return float(self._default_codes.get(name, 0))

        mapping = self._category_codes.get(name, {})
        code = mapping.get(text.casefold())
        if code is None:
            logger.warning("Unknown category %r for %s; using default", text, name)
            return float(self._default_codes.get(name, 0))
        return float(code)

    def _encode_number(self, spec: FeatureSpec, value: Any) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            number = float(spec.default)
        if np.isnan(number):
            number = float(spec.default)
        if spec.minimum is not None:
            number = max(number, float(spec.minimum))
        if spec.maximum is not None:
            number = min(number, float(spec.maximum))
        return number

    def build_feature_row(self, values: dict[str, Any]) -> dict[str, float]:
        """Map API snake_case values to the model's exact columns."""
        row: dict[str, float] = {}
        for name in self._model_features:
            spec = self._specs[name]
            raw = values.get(spec.api_name, spec.default)
            if raw is None:
                raw = spec.default
            row[name] = (
                self._encode_number(spec, raw)
                if spec.kind == "number"
                else self._encode_category(name, raw)
            )
        return row

    # ------------------------------------------------------------- inference
    def predict(self, values: dict[str, Any]) -> PredictionResult:
        if not self._loaded or self._model is None:
            raise ModelNotLoadedError("The screening model is not loaded")

        row = self.build_feature_row(values)
        # A DataFrame (not a list) keeps the stored feature names attached.
        frame = pd.DataFrame([[row[name] for name in self._model_features]], columns=self._model_features)

        probabilities = self._model.predict_proba(frame)[0]
        classes = [int(c) for c in self._model.classes_]
        best_index = int(np.argmax(probabilities))
        predicted_class = classes[best_index]

        prob_map = {str(c): float(p) for c, p in zip(classes, probabilities)}
        max_class = max(classes) if max(classes) > 0 else 1

        # Expected severity: how far up the 0..3 ladder the probability mass
        # sits. This is more informative than "confidence" alone, because a
        # 60/40 split between "mild" and "moderate" still means real distress.
        expected_severity = float(sum(c * p for c, p in zip(classes, probabilities)) / max_class)

        thresholds = self._schema.get("risk_thresholds", {})
        moderate_at = float(thresholds.get("moderate", 0.35))
        high_at = float(thresholds.get("high", 0.65))
        if expected_severity >= high_at:
            risk_level = "high"
        elif expected_severity >= moderate_at:
            risk_level = "moderate"
        else:
            risk_level = "low"

        if (
            settings.escalate_on_suicidal_ideation
            and str(values.get("suicidal_thoughts", "No")).strip().lower() == "yes"
            and risk_level != "high"
        ):
            risk_level = "high"

        class_labels = self._schema.get("class_labels", {})
        predicted_category = class_labels.get(str(predicted_class), f"Class {predicted_class}")

        return PredictionResult(
            predicted_class=predicted_class,
            predicted_category=predicted_category,
            confidence=float(probabilities[best_index]),
            probabilities=prob_map,
            expected_severity=expected_severity,
            risk_level=risk_level,
            risk_score=expected_severity,
            drivers=self._build_drivers(values, row),
            feature_values={spec.api_name: values.get(spec.api_name, spec.default) for spec in self._specs.values()},
            encoded_row=row,
        )

    # ----------------------------------------------------------- explanation
    def _build_drivers(self, values: dict[str, Any], row: dict[str, float]) -> list[dict]:
        """Rank features by (distance from the reference profile) x (importance).

        This is a transparent heuristic, not SHAP. It answers "which answers
        differ most from a typical low-risk profile, weighted by how much the
        model relies on that feature", which is enough context for a user-facing
        explanation and cheap to compute.
        """
        scored: list[dict] = []

        for name in self._model_features:
            spec = self._specs[name]
            importance = self._importances.get(name, 0.0)
            raw = values.get(spec.api_name, spec.default)

            if spec.kind == "number":
                span = (spec.maximum or 0) - (spec.minimum or 0)
                deviation = 0.0 if not span else (row[name] - float(spec.default)) / span
            else:
                category_count = max(len(spec.categories), 2)
                deviation = (row[name] - self._default_codes.get(name, 0)) / (category_count - 1)

            deviation = float(np.clip(deviation, -1.0, 1.0))
            if abs(deviation) < 0.05:
                continue

            scored.append(
                {
                    "feature": spec.api_name,
                    "label": spec.label,
                    "value": raw,
                    "direction": "elevated" if deviation > 0 else "reduced",
                    "importance": round(importance, 4),
                    "_score": abs(deviation) * importance,
                }
            )

        scored.sort(key=lambda item: item["_score"], reverse=True)
        for item in scored:
            item.pop("_score", None)
        return scored[:4]

    # ------------------------------------------------------------------ info
    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def encoding_source(self) -> str:
        return self._encoding_source

    @property
    def feature_specs(self) -> dict[str, FeatureSpec]:
        return dict(self._specs_by_api)

    @property
    def model_features(self) -> list[str]:
        return list(self._model_features)

    def model_info(self) -> dict[str, Any]:
        meta = self._schema.get("model", {})
        return {
            "name": meta.get("name", settings.model_name),
            "version": meta.get("version", settings.model_version),
            "algorithm": meta.get("algorithm", type(self._model).__name__ if self._model else "unknown"),
            "accuracy": meta.get("accuracy", settings.model_accuracy),
            "features_used": list(self._model_features),
        }


@lru_cache
def get_ml_service() -> MLService:
    """One instance for the whole process, populated during app startup."""
    return MLService()
