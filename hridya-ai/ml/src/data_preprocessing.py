import os
import pandas as pd

print("🧹 Starting Data Preprocessing...")

dataset_dir = "ml/datasets"

# Find raw CSV files in ml/datasets/ (excluding already cleaned files)
csv_files = [f for f in os.listdir(dataset_dir) if f.endswith(".csv") and not f.startswith("cleaned_")]

if len(csv_files) < 2:
    print("⚠️ Please make sure both raw CSV files are in 'ml/datasets/' first!")
else:
    # Load both CSVs
    df1 = pd.read_csv(os.path.join(dataset_dir, csv_files[0]))
    df2 = pd.read_csv(os.path.join(dataset_dir, csv_files[1]))

    print(f"Dataset 1 Shape: {df1.shape}")
    print(f"Dataset 2 Shape: {df2.shape}")

    # Combine datasets using common columns
    common_columns = list(set(df1.columns).intersection(set(df2.columns)))
    master_df = pd.concat([df1[common_columns], df2[common_columns]], ignore_index=True)
    print(f"Combined Master Dataset Shape: {master_df.shape}")

    # Data Cleaning
    master_df.drop_duplicates(inplace=True)
    master_df.replace("?", pd.NA, inplace=True)

    # Fill missing numeric values with median, categorical with mode
    for col in master_df.select_dtypes(include=["number"]).columns:
        master_df[col] = master_df[col].fillna(master_df[col].median())

    for col in master_df.select_dtypes(include=["object"]).columns:
        if not master_df[col].mode().empty:
            master_df[col] = master_df[col].fillna(master_df[col].mode()[0])

    print(f"Missing values after cleaning: {master_df.isnull().sum().sum()}")

    # Save cleaned master dataset back into ml/datasets/
    cleaned_path = os.path.join(dataset_dir, "cleaned_master_mental_health_data.csv")
    master_df.to_csv(cleaned_path, index=False)
    print(f"✨ Step 2 Complete: Cleaned dataset saved to '{cleaned_path}'!")