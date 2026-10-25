import pandas as pd
import numpy as np

df = pd.read_csv('defects_data.csv')
df['defect_date'] = pd.to_datetime(df['defect_date'])

# defects per product
defects_per_product = df.groupby('product_id').size()
print('Defects per product stats:')
print(defects_per_product.describe())
print()

# monthly defects
df['month'] = df['defect_date'].dt.to_period('M')
monthly = df.groupby('month').size()
print('Monthly defect counts:')
print(monthly)
print()
print('Monthly stats:')
print(monthly.describe())
print()

# repair cost stats
print('Repair cost mean:', df['repair_cost'].mean())
print('Repair cost std:', df['repair_cost'].std())
print()

print('Defect rate (fraction of products affected):')
print('Unique products with defects:', df['product_id'].nunique(), '/ 100')
print('Average defects per unit per month:', monthly.mean())
