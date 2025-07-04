import csv
import sqlite3
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), 'pp-complete.csv')
DB_PATH = os.path.join(os.path.dirname(__file__), 'land_registry.db')

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute('''
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    sale_price INTEGER,
    sale_date TEXT,
    postcode TEXT,
    property_type TEXT,
    new_build TEXT,
    estate_type TEXT,
    building TEXT,
    flat TEXT,
    street TEXT,
    town TEXT,
    county TEXT,
    region TEXT,
    status TEXT,
    extra1 TEXT,
    extra2 TEXT
)
''')
cur.execute('CREATE INDEX IF NOT EXISTS idx_postcode ON sales(postcode)')

with open(CSV_PATH, newline='', encoding='utf-8') as csvfile:
    reader = csv.reader(csvfile)
    header = next(reader, None)
    count = 0
    for row in reader:
        if len(row) < 16:
            continue  # skip malformed rows
        try:
            cur.execute('''
                INSERT OR IGNORE INTO sales VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', row[:16])
            count += 1
            if count % 100000 == 0:
                print(f"Imported {count} rows...")
        except Exception as e:
            print(f"Error on row {count}: {e}")
conn.commit()
conn.close()
print(f"Import complete. Total rows imported: {count}") 