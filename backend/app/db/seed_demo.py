import random
from datetime import datetime, timedelta
import sqlite3
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models.organization import Organization
from app.models.datasource import DataSource
from app.models.semantic import SemanticMetric
from app.models.memory import AgentMemory
from app.models.rbac import Role


def seed_metadata():
    """Seeds the metadata database with initial Organization, Semantic Metrics, Memory, and RBAC."""
    print("[INFO] Seeding Metadata Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Organization
        org = db.query(Organization).filter(Organization.name == "Acme Retail Corp").first()
        if not org:
            org = Organization(name="Acme Retail Corp")
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"  [+] Created Organization: {org.name} ({org.id})")
        else:
            print(f"  [+] Organization exists: {org.name}")

        # 2. Data Source
        ds = db.query(DataSource).filter(DataSource.name == "Acme E-Commerce DB").first()
        if not ds:
            ds = DataSource(
                organization_id=org.id,
                name="Acme E-Commerce DB",
                type="sqlite",
                connection_meta={"url": settings.DEMO_DATABASE_URL},
            )
            db.add(ds)
            print("  [+] Created Data Source: Acme E-Commerce DB")

        # 3. Semantic Metrics
        metrics_data = [
            {
                "name": "Revenue",
                "formula": "SUM(order_items.amount)",
                "source_table": "order_items",
                "owner": "finance_team",
                "refresh_frequency": "daily",
                "allowed_dimensions": ["region", "product_category", "product_name", "customer_segment", "month"],
                "business_terms": ["sales", "revenue", "omzet", "penjualan", "pendapatan", "turnover"],
                "business_rules": "Revenue excludes cancelled orders and tax unless explicitly requested.",
            },
            {
                "name": "Order Count",
                "formula": "COUNT(DISTINCT orders.id)",
                "source_table": "orders",
                "owner": "analytics_team",
                "refresh_frequency": "daily",
                "allowed_dimensions": ["region", "customer_segment", "month", "status"],
                "business_terms": ["total orders", "volume transaksi", "jumlah transaksi", "order volume"],
                "business_rules": "Counts all non-cancelled order IDs.",
            },
            {
                "name": "Average Order Value",
                "formula": "SUM(order_items.amount) / COUNT(DISTINCT orders.id)",
                "source_table": "order_items",
                "owner": "commercial_team",
                "refresh_frequency": "daily",
                "allowed_dimensions": ["region", "customer_segment", "month"],
                "business_terms": ["aov", "rata-rata belanja", "basket size", "average basket"],
                "business_rules": "Calculated across completed orders.",
            },
        ]

        for m_data in metrics_data:
            existing = db.query(SemanticMetric).filter(
                SemanticMetric.organization_id == org.id,
                SemanticMetric.name == m_data["name"],
            ).first()
            if not existing:
                metric = SemanticMetric(organization_id=org.id, **m_data)
                db.add(metric)
                print(f"  [+] Seeded Metric: {m_data['name']}")

        # 4. Agent Memories
        memory_items = [
            "Revenue excludes tax and cancelled orders by standard company policy.",
            "East Java is our flagship high-volume branch contributing 40% of total revenue.",
            "Customer churn threshold is defined as 60 days without completed transactions.",
        ]
        for mem_text in memory_items:
            existing_mem = db.query(AgentMemory).filter(
                AgentMemory.organization_id == org.id,
                AgentMemory.instruction_text == mem_text,
            ).first()
            if not existing_mem:
                mem = AgentMemory(
                    organization_id=org.id,
                    instruction_text=mem_text,
                    category="business_rule",
                    added_by="Data Lead",
                )
                db.add(mem)
                print(f"  [+] Seeded Agent Memory: {mem_text[:40]}...")

        # 5. RBAC Roles
        roles_data = [
            {
                "name": "Admin",
                "allowed_datasets": ["*"],
                "restricted_fields": [],
            },
            {
                "name": "Analyst",
                "allowed_datasets": ["orders", "order_items", "products", "customers"],
                "restricted_fields": ["customer_credit_card", "employee_salary"],
            },
            {
                "name": "Marketing",
                "allowed_datasets": ["orders", "products", "customers"],
                "restricted_fields": ["customer_credit_card", "employee_salary", "unit_cost"],
            },
        ]
        for r_data in roles_data:
            existing_role = db.query(Role).filter(
                Role.organization_id == org.id,
                Role.name == r_data["name"],
            ).first()
            if not existing_role:
                role = Role(organization_id=org.id, **r_data)
                db.add(role)
                print(f"  [+] Seeded Role: {r_data['name']}")

        db.commit()
        print("[SUCCESS] Metadata Database Seeded Successfully!")
    finally:
        db.close()


def seed_demo_database():
    """
    Creates a realistic retail SQLite database (datara_demo.db) with e-commerce data:
    - July 2026: ~$500,000 baseline
    - August 2026: ~$425,000 (-15% Drop)
    - Root Cause: 'Product Alpha' in 'East Java' dropped sharply by ~60% due to inventory stockout.
    """
    print("\n[INFO] Seeding Demo Business Database (datara_demo.db)...")
    db_path = "./datara_demo.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Drop existing tables
    cur.execute("DROP TABLE IF EXISTS order_items;")
    cur.execute("DROP TABLE IF EXISTS orders;")
    cur.execute("DROP TABLE IF EXISTS products;")
    cur.execute("DROP TABLE IF EXISTS customers;")

    # 1. Customers
    cur.execute("""
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        segment TEXT NOT NULL,
        region TEXT NOT NULL,
        customer_credit_card TEXT NOT NULL
    );
    """)

    regions = ["East Java", "West Java", "Jakarta", "Central Java", "Bali"]
    segments = ["Enterprise", "SMB", "Retail"]
    customers = []
    for i in range(1, 201):
        region = "East Java" if i <= 80 else random.choice(regions)
        segment = random.choice(segments)
        cc = f"4111-XXXX-XXXX-{1000 + i}"
        customers.append((i, f"Customer {i}", segment, region, cc))

    cur.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?)", customers)

    # 2. Products
    cur.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit_price REAL NOT NULL
    );
    """)

    products_data = [
        (1, "Product Alpha (Flagship)", "Electronics", 500.0),
        (2, "Product Beta (Standard)", "Electronics", 250.0),
        (3, "Smart Watch Pro", "Wearables", 150.0),
        (4, "Ergonomic Office Chair", "Furniture", 200.0),
        (5, "Wireless Headphones", "Accessories", 80.0),
        (6, "Fast Charging Hub", "Accessories", 40.0),
    ]
    cur.executemany("INSERT INTO products VALUES (?, ?, ?, ?)", products_data)

    # 3. Orders & Order Items
    cur.execute("""
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        order_date TEXT NOT NULL,
        status TEXT NOT NULL,
        month TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    """)

    cur.execute("""
    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    random.seed(42)
    order_id = 1
    order_rows = []
    item_rows = []

    # Generate July 2026 Orders (~$500k total)
    start_july = datetime(2026, 7, 1)
    for day in range(31):
        d = start_july + timedelta(days=day)
        date_str = d.strftime("%Y-%m-%d")
        for _ in range(25):  # ~25 orders/day = 775 orders
            cust_id = random.randint(1, 200)
            order_rows.append((order_id, cust_id, date_str, "completed", "2026-07"))

            # Items
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                p = random.choice(products_data)
                qty = random.randint(1, 4)
                amount = qty * p[3]
                item_rows.append((order_id, p[0], qty, p[3], amount))
            order_id += 1

    # Generate August 2026 Orders (~$425k total, drop in East Java Product Alpha)
    start_aug = datetime(2026, 8, 1)
    for day in range(31):
        d = start_aug + timedelta(days=day)
        date_str = d.strftime("%Y-%m-%d")
        for _ in range(23):
            cust_id = random.randint(1, 200)
            # Find customer region
            cust_region = "East Java" if cust_id <= 80 else "Other"

            order_rows.append((order_id, cust_id, date_str, "completed", "2026-08"))

            num_items = random.randint(1, 3)
            for _ in range(num_items):
                p = random.choice(products_data)
                # Anomaly condition: Product Alpha (ID 1) in East Java heavily reduced
                if p[0] == 1 and cust_region == "East Java":
                    if random.random() < 0.70:  # 70% of Product Alpha orders dropped in East Java
                        continue
                qty = random.randint(1, 4)
                amount = qty * p[3]
                item_rows.append((order_id, p[0], qty, p[3], amount))
            order_id += 1

    cur.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?)", order_rows)
    cur.executemany(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)",
        item_rows,
    )

    conn.commit()

    # Verify numbers
    cur.execute("""
    SELECT o.month, COUNT(DISTINCT o.id) as orders, SUM(oi.amount) as revenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.month;
    """)
    summary = cur.fetchall()
    print("  [DATA] Monthly Revenue Summary:")
    for month, orders, rev in summary:
        print(f"     - {month}: {orders:,} orders | Revenue: ${rev:,.2f}")

    conn.close()
    print("[SUCCESS] Demo Business Database Seeded Successfully!")


if __name__ == "__main__":
    seed_metadata()
    seed_demo_database()
