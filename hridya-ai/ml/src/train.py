import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

print("🚀 Starting Hridya AI Model Training on Real Master Dataset (143,256 rows, 19 columns)...")

# 1. Load cleaned master dataset from ml/datasets/
cleaned_path = "ml/datasets/cleaned_master_mental_health_data.csv"
if not os.path.exists(cleaned_path):
    raise FileNotFoundError("❌ Cleaned dataset not found! Run 'data_preprocessing.py' first.")

df = pd.read_csv(cleaned_path)
print(f"📊 Loaded Dataset Shape: {df.shape}")

# 2. Encode categorical text features and identifiers
df_encoded = df.copy()
if "Name" in df_encoded.columns:
    df_encoded.drop(columns=["Name"], inplace=True)  # Drop unique name identifiers

for col in df_encoded.select_dtypes(include=["object"]).columns:
    le = LabelEncoder()
    df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))

# 3. Define Features (X) and Target (y)
target_column = "Depression" if "Depression" in df_encoded.columns else df_encoded.columns[-1]
X = df_encoded.drop(columns=[target_column])
y = df_encoded[target_column]

# If the target label column is text-based (e.g., 'Yes'/'No'), encode it to numeric
if y.dtype == 'object':
    le_y = LabelEncoder()
    y = le_y.fit_transform(y.astype(str))

print(f"Features shape (X): {X.shape}, Target shape (y): {y.shape}")

# 4. Train / Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 5. Define Models to Compare (Random Forest vs. XGBoost)
models = {
    "Random Forest": RandomForestClassifier(
        n_estimators=100, max_depth=8, random_state=42
    ),
    "XGBoost": XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.05,
        eval_metric="mlogloss",
        random_state=42
    ),
}

best_model = None
best_score = 0

# 6. Train, Evaluate, and Compare Both Models
for name, clf in models.items():
    print(f"\n🏋️‍♂️ Training {name}...")
    clf.fit(X_train, y_train)
    
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"✨ {name} Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, preds, zero_division=0))
    print("Confusion Matrix:\n", confusion_matrix(y_test, preds))
    
    # Track the best performing model
    if acc > best_score:
        best_score = acc
        best_model = clf

# 7. Save the Best Performing Model Artifact into ml/models/
os.makedirs("ml/models", exist_ok=True)
model_path = "ml/models/hridya_screening_model.joblib"
joblib.dump(best_model, model_path)

print(f"\n💾 Saved Best Model ({best_model.__class__.__name__}) to '{model_path}'!")