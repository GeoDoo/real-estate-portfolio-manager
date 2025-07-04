import os
import sqlite3

def get_comparable_sales(postcode, limit=50):
    """Fetch comparable sales for a postcode from the SQLite database."""
    db_path = os.path.join(os.path.dirname(__file__), 'land_registry.db')
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute(
            "SELECT id, sale_price, sale_date, postcode, property_type, new_build, estate_type, building, flat, street, town FROM sales WHERE postcode = ? ORDER BY sale_date DESC LIMIT ?",
            (postcode, limit)
        )
        rows = cur.fetchall()
        sales = []
        for row in rows:
            sales.append({
                "id": row[0],
                "sale_price": row[1],
                "sale_date": row[2],
                "postcode": row[3],
                "property_type": row[4],
                "new_build": row[5] == "Y",
                "estate_type": row[6],
                "building": row[7],
                "flat": row[8],
                "street": row[9],
                "town": row[10],
                "source": "land_registry"
            })
        return sales
    except Exception as e:
        raise RuntimeError(f"Failed to fetch comparable sales: {e}")
    finally:
        if 'conn' in locals():
            conn.close() 