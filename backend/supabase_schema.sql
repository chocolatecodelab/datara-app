-- ====================================================================
-- Datara — AI Agentic Data Analyst Engine
-- Supabase (PostgreSQL) Metadata & State Store Schema
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Multi-tenant boundary)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Data Sources (Connections to customer data sources)
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'postgres', 'sqlite', 'snowflake', 'bigquery', 'csv_upload'
    connection_meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Semantic Metrics (Single Source of Truth for Business Metrics)
CREATE TABLE IF NOT EXISTS semantic_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    formula VARCHAR(255) NOT NULL,
    source_table VARCHAR(100) NOT NULL,
    owner VARCHAR(100) DEFAULT 'data_team',
    refresh_frequency VARCHAR(50) DEFAULT 'daily',
    allowed_dimensions JSONB DEFAULT '[]'::jsonb,
    business_terms JSONB DEFAULT '[]'::jsonb,
    business_rules TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Roles & RBAC Governance
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'Admin', 'Analyst', 'Marketing', 'Finance'
    allowed_datasets JSONB DEFAULT '[]'::jsonb,
    restricted_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Conversations (Investigation Sessions)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(100) DEFAULT 'default_user' NOT NULL,
    goal_or_question TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'planning' NOT NULL, -- 'planning', 'analyzing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Analysis Steps (Progressive Steps in Autonomous Plan)
CREATE TABLE IF NOT EXISTS analysis_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
    duration_ms INTEGER,
    result_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Tool Calls (Audit Log of Tools & SQL Executed)
CREATE TABLE IF NOT EXISTS tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_step_id UUID NOT NULL REFERENCES analysis_steps(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    arguments JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    executed_sql TEXT,
    latency_ms INTEGER,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Explainable Insights (5-Pillar Output Cards)
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    finding TEXT NOT NULL,
    evidence TEXT NOT NULL,
    evidence_rows INTEGER DEFAULT 0,
    calculation VARCHAR(255) NOT NULL,
    confidence NUMERIC(4,2) DEFAULT 0.85,
    main_drivers JSONB DEFAULT '[]'::jsonb,
    data_source VARCHAR(255) DEFAULT 'PostgreSQL / Warehouse',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8b. Business Recommendations & Action Plans (Level 6)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    rationale TEXT NOT NULL,
    target_dimension VARCHAR(100),
    estimated_impact_amount NUMERIC(15,2) DEFAULT 0.00,
    estimated_impact_pct NUMERIC(5,2) DEFAULT 0.00,
    confidence NUMERIC(4,2) DEFAULT 0.85,
    priority VARCHAR(20) DEFAULT 'P1 - High',
    difficulty VARCHAR(20) DEFAULT 'Medium',
    action_steps JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'pending_approval' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. Agent Memory (Organization Business Rules & Instructions)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    instruction_text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'business_rule',
    added_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- Indexes for Performance & Search
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_semantic_metrics_org ON semantic_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_semantic_metrics_name ON semantic_metrics(name);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_analysis_steps_conv ON analysis_steps(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_step ON tool_calls(analysis_step_id);
CREATE INDEX IF NOT EXISTS idx_insights_conv ON insights(conversation_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_conv ON recommendations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_org ON agent_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);

-- ====================================================================
-- Seed Initial Baseline Data
-- ====================================================================
DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Insert Default Organization if not exists
    SELECT id INTO org_id FROM organizations WHERE name = 'Acme Retail Corp' LIMIT 1;
    IF org_id IS NULL THEN
        INSERT INTO organizations (name) VALUES ('Acme Retail Corp') RETURNING id INTO org_id;
    END IF;

    -- Insert Semantic Metrics
    IF NOT EXISTS (SELECT 1 FROM semantic_metrics WHERE organization_id = org_id AND name = 'Revenue') THEN
        INSERT INTO semantic_metrics (organization_id, name, formula, source_table, owner, refresh_frequency, allowed_dimensions, business_terms, business_rules)
        VALUES (
            org_id,
            'Revenue',
            'SUM(order_items.amount)',
            'order_items',
            'finance_team',
            'daily',
            '["region", "product_category", "product_name", "customer_segment", "month"]'::jsonb,
            '["sales", "revenue", "omzet", "penjualan", "pendapatan", "turnover"]'::jsonb,
            'Revenue excludes cancelled orders and tax unless explicitly requested.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM semantic_metrics WHERE organization_id = org_id AND name = 'Order Count') THEN
        INSERT INTO semantic_metrics (organization_id, name, formula, source_table, owner, refresh_frequency, allowed_dimensions, business_terms, business_rules)
        VALUES (
            org_id,
            'Order Count',
            'COUNT(DISTINCT orders.id)',
            'orders',
            'analytics_team',
            'daily',
            '["region", "customer_segment", "month", "status"]'::jsonb,
            '["total orders", "volume transaksi", "jumlah transaksi", "order volume"]'::jsonb,
            'Counts all non-cancelled order IDs.'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM semantic_metrics WHERE organization_id = org_id AND name = 'Average Order Value') THEN
        INSERT INTO semantic_metrics (organization_id, name, formula, source_table, owner, refresh_frequency, allowed_dimensions, business_terms, business_rules)
        VALUES (
            org_id,
            'Average Order Value',
            'SUM(order_items.amount) / COUNT(DISTINCT orders.id)',
            'order_items',
            'commercial_team',
            'daily',
            '["region", "customer_segment", "month"]'::jsonb,
            '["aov", "rata-rata belanja", "basket size", "average basket"]'::jsonb,
            'Calculated across completed orders.'
        );
    END IF;

    -- Insert Agent Memories
    IF NOT EXISTS (SELECT 1 FROM agent_memory WHERE organization_id = org_id AND instruction_text LIKE 'Revenue excludes tax%') THEN
        INSERT INTO agent_memory (organization_id, instruction_text, category, added_by)
        VALUES (
            org_id,
            'Revenue excludes tax and cancelled orders by standard company policy.',
            'business_rule',
            'Data Lead'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM agent_memory WHERE organization_id = org_id AND instruction_text LIKE 'East Java is our flagship%') THEN
        INSERT INTO agent_memory (organization_id, instruction_text, category, added_by)
        VALUES (
            org_id,
            'East Java is our flagship high-volume branch contributing 40% of total revenue.',
            'organization_context',
            'Data Lead'
        );
    END IF;

    -- Insert Default Roles
    IF NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = org_id AND name = 'Admin') THEN
        INSERT INTO roles (organization_id, name, allowed_datasets, restricted_fields)
        VALUES (org_id, 'Admin', '["*"]'::jsonb, '[]'::jsonb);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = org_id AND name = 'Analyst') THEN
        INSERT INTO roles (organization_id, name, allowed_datasets, restricted_fields)
        VALUES (org_id, 'Analyst', '["orders", "order_items", "products", "customers"]'::jsonb, '["customer_credit_card", "employee_salary"]'::jsonb);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = org_id AND name = 'Marketing') THEN
        INSERT INTO roles (organization_id, name, allowed_datasets, restricted_fields)
        VALUES (org_id, 'Marketing', '["orders", "products", "customers"]'::jsonb, '["customer_credit_card", "employee_salary", "unit_cost"]'::jsonb);
    END IF;

END $$;
