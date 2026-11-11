import os
import shutil
import kagglehub
import importlib

print("📥 Downloading datasets from Kaggle...")
importlib.reload(kagglehub)

# 1. Download datasets using kagglehub
path1 = kagglehub.dataset_download("sumansharmadataworld/depression-surveydataset-for-analysis")
path2 = kagglehub.dataset_download("vishalfalnikar/mental-health-dataset-machine-learning")

# 2. Ensure ml/datasets folder exists
os.makedirs("ml/datasets", exist_ok=True)

# 3. Copy CSV files into ml/datasets/
for p in [path1, path2]:
    for file in os.listdir(p):
        if file.endswith(".csv"):
            src = os.path.join(p, file)
            dst = os.path.join("ml/datasets", file)
            shutil.copy(src, dst)
            print(f"📁 Copied {file} to ml/datasets/")

print("✅ Step 1 Complete: Raw datasets are now inside ml/datasets/")