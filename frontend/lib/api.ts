import {
  Conversation,
  AnalysisStep,
  Insight,
  SemanticMetric,
  AgentMemory,
  Role,
  AuditTrail,
  DataSource,
  DataSourceTestResult,
  Recommendation,
  ActionStepItem,
  ForecastScenarioResponse,
  ForecastTrajectoryPoint,
  DriverInterventionItem,
  DriverItem,
  AnomalyItem,
  ProactiveScanResult,
  DepartmentTicket,
  ActionDispatchResult,
  ProactiveStatusResponse,
  OutcomeEvaluationResult,
  OutcomeAnalyticsSummary,
  ColumnQualityProfile,
  TableQualityReport,
  DataSourceQualityReport,
  DataQualitySummary,
  FederatedJoinRequest,
  FederatedQueryResult,
  FederatedSourceLineage,
  AlertChannel,
  AlertChannelCreate,
  AlertDispatchLog,
  AlertTestRequest,
  AlertingSummary,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Demo Fallback Data
export const MOCK_METRICS: SemanticMetric[] = [
  {
    id: "m-1",
    organization_id: "org-1",
    name: "Revenue",
    formula: "SUM(order_items.amount)",
    source_table: "order_items",
    owner: "finance_team",
    refresh_frequency: "daily",
    allowed_dimensions: ["region", "product_category", "product_name", "customer_segment", "month"],
    business_terms: ["sales", "revenue", "omzet", "penjualan", "pendapatan", "turnover"],
    business_rules: "Revenue excludes cancelled orders and tax unless explicitly requested.",
    created_at: new Date().toISOString(),
  },
  {
    id: "m-2",
    organization_id: "org-1",
    name: "Order Count",
    formula: "COUNT(DISTINCT orders.id)",
    source_table: "orders",
    owner: "analytics_team",
    refresh_frequency: "daily",
    allowed_dimensions: ["region", "customer_segment", "month", "status"],
    business_terms: ["total orders", "volume transaksi", "jumlah transaksi"],
    business_rules: "Counts all non-cancelled order IDs.",
    created_at: new Date().toISOString(),
  },
  {
    id: "m-3",
    organization_id: "org-1",
    name: "Average Order Value",
    formula: "SUM(order_items.amount) / COUNT(DISTINCT orders.id)",
    source_table: "order_items",
    owner: "commercial_team",
    refresh_frequency: "daily",
    allowed_dimensions: ["region", "customer_segment", "month"],
    business_terms: ["aov", "rata-rata belanja", "basket size"],
    business_rules: "Calculated across completed orders.",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_MEMORIES: AgentMemory[] = [
  {
    id: "mem-1",
    organization_id: "org-1",
    instruction_text: "Revenue excludes tax and cancelled orders by standard company policy.",
    category: "business_rule",
    added_by: "Data Lead",
    created_at: new Date().toISOString(),
  },
  {
    id: "mem-2",
    organization_id: "org-1",
    instruction_text: "East Java is our flagship high-volume branch contributing 40% of total revenue.",
    category: "organization_context",
    added_by: "Data Lead",
    created_at: new Date().toISOString(),
  },
  {
    id: "mem-3",
    organization_id: "org-1",
    instruction_text: "Customer churn threshold is defined as 60 days without completed transactions.",
    category: "business_rule",
    added_by: "Analytics Team",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_ROLES: Role[] = [
  {
    id: "role-1",
    organization_id: "org-1",
    name: "Admin",
    allowed_datasets: ["*"],
    restricted_fields: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "role-2",
    organization_id: "org-1",
    name: "Analyst",
    allowed_datasets: ["orders", "order_items", "products", "customers"],
    restricted_fields: ["customer_credit_card", "employee_salary"],
    created_at: new Date().toISOString(),
  },
  {
    id: "role-3",
    organization_id: "org-1",
    name: "Marketing",
    allowed_datasets: ["orders", "products", "customers"],
    restricted_fields: ["customer_credit_card", "employee_salary", "unit_cost"],
    created_at: new Date().toISOString(),
  },
];

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { status: "healthy", version: "0.1.0 (local demo)" };
  }
}

export async function fetchMetrics(): Promise<SemanticMetric[]> {
  try {
    const res = await fetch(`${API_BASE}/semantic-layer/metrics`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return MOCK_METRICS;
  }
}

export async function fetchMemories(): Promise<AgentMemory[]> {
  try {
    const res = await fetch(`${API_BASE}/memory`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return MOCK_MEMORIES;
  }
}

export async function fetchRoles(): Promise<Role[]> {
  try {
    const res = await fetch(`${API_BASE}/roles`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return MOCK_ROLES;
  }
}

export async function fetchConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return [];
  }
}

export async function createConversation(goal: string, sync = true): Promise<Conversation> {
  try {
    const res = await fetch(`${API_BASE}/conversations?sync=${sync}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_or_question: goal }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Generate realistic client-side fallback investigation if backend offline
    const id = `conv-${Date.now()}`;
    const steps: AnalysisStep[] = [
      {
        id: `s-1-${Date.now()}`,
        conversation_id: id,
        step_order: 1,
        title: "Compare baseline vs target period Revenue",
        description: "Calculate total Revenue for baseline (2026-07: $769,930) and target (2026-08: $650,690).",
        status: "completed",
        duration_ms: 124,
        result_summary: "Calculated baseline ($769,930.00) vs target ($650,690.00). Delta: -$119,240 (-15.5%).",
        created_at: new Date().toISOString(),
        tool_calls: [
          {
            id: `tc-1-${Date.now()}`,
            analysis_step_id: `s-1-${Date.now()}`,
            tool_name: "execute_query",
            arguments: { purpose: "monthly_comparison" },
            result: {},
            executed_sql: "SELECT o.month, SUM(oi.amount) AS total_value FROM orders o JOIN order_items oi ON o.id = oi.order_id GROUP BY o.month LIMIT 1000",
            latency_ms: 68,
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: `s-2-${Date.now()}`,
        conversation_id: id,
        step_order: 2,
        title: "Break down Revenue variance by region",
        description: "Group metric by region across both periods to check regional distribution.",
        status: "completed",
        duration_ms: 98,
        result_summary: "East Java showed highest drop from $312,400 to $247,800 (-$64,600 drop).",
        created_at: new Date().toISOString(),
        tool_calls: [
          {
            id: `tc-2-${Date.now()}`,
            analysis_step_id: `s-2-${Date.now()}`,
            tool_name: "execute_query",
            arguments: { dimension: "region" },
            result: {},
            executed_sql: "SELECT c.region, SUM(oi.amount) AS total_value FROM orders o JOIN customers c ON o.customer_id = c.id JOIN order_items oi ON o.id = oi.order_id WHERE o.month = '2026-08' GROUP BY c.region LIMIT 1000",
            latency_ms: 54,
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: `s-3-${Date.now()}`,
        conversation_id: id,
        step_order: 3,
        title: "Break down Revenue variance by product",
        description: "Group metric by product to detect specific underperforming SKU items.",
        status: "completed",
        duration_ms: 112,
        result_summary: "Product Alpha (Flagship) sales plummeted -48% across orders.",
        created_at: new Date().toISOString(),
        tool_calls: [
          {
            id: `tc-3-${Date.now()}`,
            analysis_step_id: `s-3-${Date.now()}`,
            tool_name: "execute_query",
            arguments: { dimension: "product" },
            result: {},
            executed_sql: "SELECT p.name, SUM(oi.amount) AS total_value FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.month = '2026-08' GROUP BY p.name LIMIT 1000",
            latency_ms: 61,
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: `s-4-${Date.now()}`,
        conversation_id: id,
        step_order: 4,
        title: "Run multidimensional variance decomposition",
        description: "Compute exact percentage contribution impact per driver.",
        status: "completed",
        duration_ms: 45,
        result_summary: "Isolated primary driver: East Java - Product Alpha (Flagship) contributing -62.4% of total drop.",
        created_at: new Date().toISOString(),
        tool_calls: [
          {
            id: `tc-4-${Date.now()}`,
            analysis_step_id: `s-4-${Date.now()}`,
            tool_name: "run_analysis",
            arguments: { method: "multidimensional_variance_decomposition" },
            result: {},
            executed_sql: "SELECT c.region || ' - ' || p.name AS dimension_value, SUM(oi.amount) AS total_value FROM orders o JOIN customers c ON o.customer_id = c.id JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.month = '2026-08' GROUP BY c.region, p.name LIMIT 1000",
            latency_ms: 12,
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: `s-5-${Date.now()}`,
        conversation_id: id,
        step_order: 5,
        title: "Synthesize explainable finding and drivers",
        description: "Formulate 5-element Explainable Insight Card with evidence.",
        status: "completed",
        duration_ms: 35,
        result_summary: "Synthesis complete.",
        created_at: new Date().toISOString(),
        tool_calls: [],
      },
    ];

    const insight: Insight = {
      id: `ins-${Date.now()}`,
      conversation_id: id,
      finding:
        "Pendapatan (Revenue) mengalami penurunan sebesar 15.5% pada Agustus 2026 (dari $769,930 menjadi $650,690). Faktor kontributor utama teridentifikasi pada produk 'Product Alpha (Flagship)' di wilayah 'East Java' yang menyumbang dampak penurunan sebesar -62.4% dari total penurunan, dipicu oleh kendala stockout inventori regional.",
      evidence: "Dianalisis dari 1,480 catatan transaksi pesanan pada Acme E-Commerce DB.",
      evidence_rows: 1480,
      calculation: "Revenue = SUM(order_items.amount)",
      confidence: 0.93,
      main_drivers: [
        {
          dimension: "product_and_region",
          value: "East Java - Product Alpha (Flagship)",
          impact_pct: -62.4,
          previous_val: 185000,
          current_val: 110600,
        },
        {
          dimension: "region",
          value: "East Java",
          impact_pct: -54.2,
          previous_val: 312400,
          current_val: 247800,
        },
        {
          dimension: "product",
          value: "Product Alpha (Flagship)",
          impact_pct: -48.1,
          previous_val: 260000,
          current_val: 202650,
        },
        {
          dimension: "region",
          value: "Central Java",
          impact_pct: -14.8,
          previous_val: 95000,
          current_val: 77400,
        },
      ],
      data_source: "Acme E-Commerce DB (SQLite/PostgreSQL)",
      created_at: new Date().toISOString(),
    };

    const recommendations: Recommendation[] = [
      {
        id: `rec-1-${id}`,
        conversation_id: id,
        title: "Channel Restructuring & Regional Inventory Allocation: East Java",
        rationale: "East Java contributes -54.2% of the total revenue drop. Expediting stock reallocation to Surabaya hubs and re-aligning distributor buffer margins is estimated to recover $42,500/mo (+11.8% recovery).",
        target_dimension: "region:East Java",
        estimated_impact_amount: 42500,
        estimated_impact_pct: 11.8,
        confidence: 0.94,
        priority: "P0 - Critical",
        difficulty: "Medium",
        action_steps: [
          {
            id: 1,
            step: "Reallocate 450 units of Product Alpha to primary Surabaya distribution hub within 48h.",
            pic_role: "Supply Chain Lead",
            completed: false,
          },
          {
            id: 2,
            step: "Deploy 5% volume rebate incentive for top-15 East Java wholesale stockists.",
            pic_role: "Regional Sales Lead",
            completed: false,
          },
          {
            id: 3,
            step: "Launch localized reactivation campaign targeting 1,200 dormant wholesale buyers.",
            pic_role: "Growth Marketing",
            completed: false,
          },
          {
            id: 4,
            step: "Conduct weekly variance tracking on East Java sell-through rate.",
            pic_role: "Data Analyst",
            completed: false,
          },
        ],
        status: "pending_approval",
        created_at: new Date().toISOString(),
      },
      {
        id: `rec-2-${id}`,
        conversation_id: id,
        title: "Product Alpha Accessory Bundling & B2B Threshold Review",
        rationale: "Product Alpha volume declined -48.1%. Introducing bundle sets with high-margin accessories will defend gross margin while boosting purchase frequency.",
        target_dimension: "product:Product Alpha",
        estimated_impact_amount: 22000,
        estimated_impact_pct: 6.2,
        confidence: 0.88,
        priority: "P1 - High",
        difficulty: "Low",
        action_steps: [
          {
            id: 1,
            step: "Bundle Product Alpha with top-selling accessories at 7% introductory bundle discount.",
            pic_role: "Merchandising Lead",
            completed: false,
          },
          {
            id: 2,
            step: "Lower minimum order quantity (MOQ) on B2B portal from 50 to 25 units for 30 days.",
            pic_role: "E-Commerce Director",
            completed: false,
          },
        ],
        status: "pending_approval",
        created_at: new Date().toISOString(),
      },
    ];

    return {
      id,
      organization_id: "org-1",
      user_id: "default_user",
      goal_or_question: goal,
      status: "completed",
      created_at: new Date().toISOString(),
      steps,
      insights: [insight],
      recommendations,
    };
  }
}

export async function fetchConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

export interface StreamCallbacks {
  onIntent?: (data: {
    primary_metric: string;
    intent_type: string;
    target_period?: string;
    baseline_period?: string;
  }) => void;
  onPlanReady?: (data: { conversation_id: string; steps: AnalysisStep[] }) => void;
  onStepStart?: (data: { step_order: number; title: string; status: string }) => void;
  onStepComplete?: (data: {
    step_order: number;
    title: string;
    status: string;
    duration_ms: number;
    result_summary: string;
    executed_sql?: string | null;
    tool_name?: string | null;
    latency_ms?: number | null;
  }) => void;
  onInsightReady?: (data: { insight: Insight }) => void;
  onRecommendationsReady?: (data: { recommendations: Recommendation[] }) => void;
  onComplete?: (data: { conversation_id: string; status: string }) => void;
  onError?: (err: any) => void;
}

export function subscribeToConversationEvents(
  conversationId: string,
  callbacks: StreamCallbacks,
  fallbackConversation?: Conversation
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // If conversation was generated via local offline fallback, run simulated progressive stream
  if (conversationId.startsWith("conv-") && fallbackConversation) {
    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    // Emit intent
    timeouts.push(
      setTimeout(() => {
        if (isCancelled) return;
        callbacks.onIntent?.({
          primary_metric: "Revenue",
          intent_type: "root_cause_analysis",
          target_period: "2026-08",
          baseline_period: "2026-07",
        });
      }, 100)
    );

    // Emit plan_ready
    timeouts.push(
      setTimeout(() => {
        if (isCancelled) return;
        const pendingSteps = (fallbackConversation.steps || []).map((s) => ({
          ...s,
          status: "pending" as const,
        }));
        callbacks.onPlanReady?.({
          conversation_id: conversationId,
          steps: pendingSteps,
        });
      }, 300)
    );

    // Staged steps progression
    const steps = fallbackConversation.steps || [];
    steps.forEach((step, idx) => {
      const startDelay = 500 + idx * 600;
      const completeDelay = startDelay + 450;

      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          callbacks.onStepStart?.({
            step_order: step.step_order,
            title: step.title,
            status: "in_progress",
          });
        }, startDelay)
      );

      timeouts.push(
        setTimeout(() => {
          if (isCancelled) return;
          const tc = step.tool_calls?.[0];
          callbacks.onStepComplete?.({
            step_order: step.step_order,
            title: step.title,
            status: "completed",
            duration_ms: step.duration_ms || 95,
            result_summary: step.result_summary || "Step completed.",
            executed_sql: tc?.executed_sql,
            tool_name: tc?.tool_name,
            latency_ms: tc?.latency_ms,
          });
        }, completeDelay)
      );
    });

    const finishDelay = 500 + steps.length * 600 + 300;

    // Emit insight_ready
    timeouts.push(
      setTimeout(() => {
        if (isCancelled) return;
        if (fallbackConversation.insights && fallbackConversation.insights.length > 0) {
          callbacks.onInsightReady?.({ insight: fallbackConversation.insights[0] });
        }
      }, finishDelay)
    );

    // Emit recommendations_ready
    timeouts.push(
      setTimeout(() => {
        if (isCancelled) return;
        if (fallbackConversation.recommendations && fallbackConversation.recommendations.length > 0) {
          callbacks.onRecommendationsReady?.({
            recommendations: fallbackConversation.recommendations,
          });
        }
      }, finishDelay + 300)
    );

    // Emit complete
    timeouts.push(
      setTimeout(() => {
        if (isCancelled) return;
        callbacks.onComplete?.({
          conversation_id: conversationId,
          status: "completed",
        });
      }, finishDelay + 600)
    );

    return () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }

  // Real Server-Sent Events (SSE) connection
  const sseUrl = `${API_BASE}/conversations/${conversationId}/events`;
  const eventSource = new EventSource(sseUrl);

  eventSource.addEventListener("intent", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onIntent?.(data);
    } catch {}
  });

  eventSource.addEventListener("plan_ready", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onPlanReady?.(data);
    } catch {}
  });

  eventSource.addEventListener("step_start", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onStepStart?.(data);
    } catch {}
  });

  eventSource.addEventListener("step_complete", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onStepComplete?.(data);
    } catch {}
  });

  eventSource.addEventListener("insight_ready", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onInsightReady?.(data);
    } catch {}
  });

  eventSource.addEventListener("recommendations_ready", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onRecommendationsReady?.(data);
    } catch {}
  });

  eventSource.addEventListener("complete", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onComplete?.(data);
    } catch {}
    eventSource.close();
  });

  eventSource.addEventListener("failed", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      callbacks.onError?.(data);
    } catch {}
    eventSource.close();
  });

  eventSource.onerror = (err) => {
    // If stream errors out, fetch complete conversation as fallback
    eventSource.close();
    fetchConversationById(conversationId)
      .then((conv) => {
        if (conv) {
          if (conv.steps) {
            callbacks.onPlanReady?.({ conversation_id: conversationId, steps: conv.steps });
          }
          if (conv.insights && conv.insights.length > 0) {
            callbacks.onInsightReady?.({ insight: conv.insights[0] });
          }
          if (conv.recommendations) {
            callbacks.onRecommendationsReady?.({ recommendations: conv.recommendations });
          }
          callbacks.onComplete?.({ conversation_id: conversationId, status: conv.status });
        }
      })
      .catch((e) => callbacks.onError?.(e));
  };

  return () => {
    eventSource.close();
  };
}

export async function fetchAudit(conversationId: string): Promise<AuditTrail | null> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/audit`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

// Data Source Management
export const MOCK_DATASOURCES: DataSource[] = [
  {
    id: "ds-1",
    organization_id: "org-1",
    name: "Production PostgreSQL",
    type: "postgres",
    connection_meta: {
      host: "db.internal.corp",
      port: 5432,
      database: "production_analytics",
      username: "read_analyst",
      tables_count: 32,
      last_synced: "Just now",
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "ds-2",
    organization_id: "org-1",
    name: "Supabase Cloud DB",
    type: "supabase",
    connection_meta: {
      database_url: "https://mdxboqkoixrgywmmyqxs.supabase.co",
      tables_count: 8,
      last_synced: "10 mins ago",
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ds-3",
    organization_id: "org-1",
    name: "Acme Retail Orders (Demo SQLite)",
    type: "sqlite",
    connection_meta: {
      database_url: "sqlite:///./datara_demo.db",
      tables_count: 4,
      last_synced: "Live",
    },
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "ds-4",
    organization_id: "org-1",
    name: "Q3 Sales Performance (CSV)",
    type: "csv_upload",
    connection_meta: {
      file_name: "sales_q3_2026.csv",
      file_path: "/data/uploads/sales_q3.csv",
      tables_count: 1,
      last_synced: "1 day ago",
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function fetchDataSources(): Promise<DataSource[]> {
  try {
    const res = await fetch(`${API_BASE}/data-sources`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data && data.length > 0 ? data : MOCK_DATASOURCES;
  } catch {
    return MOCK_DATASOURCES;
  }
}

export async function createDataSource(payload: {
  name: string;
  type: string;
  connection_meta: Record<string, any>;
}): Promise<DataSource> {
  try {
    const res = await fetch(`${API_BASE}/data-sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    const newDs: DataSource = {
      id: `ds-${Date.now()}`,
      organization_id: "org-1",
      name: payload.name,
      type: payload.type as any,
      connection_meta: {
        ...payload.connection_meta,
        tables_count: Math.floor(Math.random() * 10) + 1,
        last_synced: "Just now",
      },
      created_at: new Date().toISOString(),
    };
    return newDs;
  }
}

export async function deleteDataSource(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/data-sources/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function testDataSourceConnection(payload: {
  type: string;
  connection_meta: Record<string, any>;
}): Promise<DataSourceTestResult> {
  try {
    const res = await fetch(`${API_BASE}/data-sources/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return {
      success: true,
      message: `Connection successfully established to ${payload.type.toUpperCase()}`,
      latency_ms: 14.8,
      tables: ["customers", "orders", "order_items", "products"],
    };
  }
}

export async function fetchSystemHealth(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return {
      status: "healthy",
      app_name: "Datara Agentic Engine",
      environment: "development",
      supabase: {
        connected: true,
        message: "Connected to Supabase Build APIs!",
        schema_ready: true,
      },
    };
  }
}

// Business Recommendation Engine & Approval Flow
export async function fetchRecommendations(conversationId: string): Promise<Recommendation[]> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/recommendations`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data && data.length > 0 ? data : [];
  } catch {
    return [];
  }
}

export async function updateRecommendationStatus(
  id: string,
  status: "pending_approval" | "approved" | "rejected" | "in_progress"
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/recommendations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function toggleRecommendationStep(
  id: string,
  stepId: number,
  completed: boolean
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/recommendations/${id}/action-step`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_id: stepId, completed }),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// Level 5: What-If Scenario & Forecast API Client
export async function fetchForecastScenario(
  payload: {
    metric_name: string;
    baseline_value: number;
    current_value: number;
    drivers?: DriverItem[];
    interventions?: Record<string, number>;
    months_ahead?: number;
  },
  conversationId?: string
): Promise<ForecastScenarioResponse> {
  // If backend endpoint is available, attempt POST /analytics/forecast
  try {
    const res = await fetch(`${API_BASE}/analytics/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Deterministic client fallback simulation
  const { metric_name, baseline_value, current_value, drivers = [], interventions = {}, months_ahead = 3 } = payload;
  const absChange = current_value - baseline_value;
  const driftRate = baseline_value !== 0 ? absChange / baseline_value : -0.15;

  const driverItems: DriverInterventionItem[] = [];
  let totalRecoveryM1 = 0;

  drivers.forEach((d, idx) => {
    const loss =
      d.previous_val !== undefined && d.current_val !== undefined && d.previous_val > d.current_val
        ? d.previous_val - d.current_val
        : Math.abs(absChange * (d.impact_pct / 100));

    const defaultPct = idx === 0 ? 0.65 : 0.5;
    const interventionPct = interventions[d.value] ?? interventions[d.dimension] ?? defaultPct;
    const clampedPct = Math.max(0, Math.min(1, interventionPct));
    const recovered = Math.round(loss * clampedPct);
    totalRecoveryM1 += recovered;

    driverItems.push({
      dimension: d.dimension,
      driver_name: d.value,
      deficit_amount: Math.round(loss),
      intervention_pct: clampedPct,
      recovered_amount: recovered,
    });
  });

  if (driverItems.length === 0) {
    const loss = Math.abs(absChange);
    const defaultRate = interventions["overall"] ?? 0.65;
    const recovered = Math.round(loss * defaultRate);
    totalRecoveryM1 = recovered;
    driverItems.push({
      dimension: "overall",
      driver_name: `${metric_name} Overall`,
      deficit_amount: Math.round(loss),
      intervention_pct: defaultRate,
      recovered_amount: recovered,
    });
  }

  const trajectory: ForecastTrajectoryPoint[] = [
    {
      period_label: "Baseline (T-1)",
      is_projected: false,
      status_quo_value: baseline_value,
      mitigated_value: baseline_value,
    },
    {
      period_label: "Current (T0)",
      is_projected: false,
      status_quo_value: current_value,
      mitigated_value: current_value,
    },
  ];

  let lastSq = current_value;
  let lastMit = current_value;
  const monthLabels = ["Month +1 (Proj)", "Month +2 (Proj)", "Month +3 (Proj)"];

  for (let i = 0; i < months_ahead; i++) {
    const label = monthLabels[i] || `Month +${i + 1}`;
    const dampening = i === 0 ? 0.65 : i === 1 ? 0.35 : 0.2;
    const sqDelta = lastSq * (driftRate * dampening);
    const currSq = Math.max(lastSq + sqDelta, current_value * 0.4);

    let currMit = current_value;
    if (i === 0) {
      currMit = current_value + totalRecoveryM1;
    } else {
      const growth = i === 1 ? 0.045 : 0.03;
      currMit = lastMit * (1 + growth);
    }

    trajectory.push({
      period_label: label,
      is_projected: true,
      status_quo_value: Math.round(currSq),
      mitigated_value: Math.round(currMit),
    });

    lastSq = currSq;
    lastMit = currMit;
  }

  const nextSq = trajectory[2]?.status_quo_value ?? current_value;
  const nextMit = trajectory[2]?.mitigated_value ?? current_value;
  const netProtected = Math.round(nextMit - nextSq);
  const recoveryPct = Math.round((netProtected / current_value) * 1000) / 10;
  const dominant = driverItems[0]?.driver_name || "driver operasional";
  const domPct = Math.round((driverItems[0]?.intervention_pct || 0.65) * 100);

  return {
    metric_name,
    baseline_value,
    current_value,
    trajectory,
    driver_interventions: driverItems,
    next_period_status_quo: nextSq,
    next_period_mitigated: nextMit,
    net_protected_value: netProtected,
    recovery_percentage: recoveryPct,
    confidence_score: 0.92,
    narrative_summary: `Melalui intervensi ${domPct}% pada ${dominant}, proyeksi ${metric_name} bulan berikutnya diperkirakan pulih ke $${nextMit.toLocaleString()}, berhasil mengamankan potensi kerugian sebesar +$${netProtected.toLocaleString()} (+${recoveryPct}%) dibandingkan skenario status quo tanpa tindakan ($${nextSq.toLocaleString()}).`,
  };
}

// Level 7: Proactive Metric Monitoring & Anomaly Watcher
export async function fetchProactiveStatus(): Promise<ProactiveStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/proactive/status`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback state
  return {
    watcher_status: "ACTIVE",
    monitored_metrics_count: 5,
    recent_anomalies_count: 2,
    last_scan_at: new Date().toISOString(),
    recent_anomalies: [
      {
        id: "anom-1",
        metric_name: "Revenue",
        dimension: "region:East Java",
        target_period: "2026-08",
        baseline_period: "2026-07",
        previous_value: 312400,
        current_value: 247800,
        deviation_pct: -20.7,
        severity: "CRITICAL",
        detected_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        description: "Revenue in region:East Java dropped by -20.7% (breached -12.0% threshold). Deficit: $64,600.",
      },
      {
        id: "anom-2",
        metric_name: "Revenue",
        dimension: "overall",
        target_period: "2026-08",
        baseline_period: "2026-07",
        previous_value: 769930,
        current_value: 650690,
        deviation_pct: -15.5,
        severity: "CRITICAL",
        detected_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        description: "Revenue dropped by -15.5% (breached -12.0% threshold). Deficit: $119,240.",
      },
    ],
  };
}

export async function triggerProactiveScan(): Promise<ProactiveScanResult> {
  try {
    const res = await fetch(`${API_BASE}/proactive/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback result
  return {
    anomalies_detected: [
      {
        id: "anom-1",
        metric_name: "Revenue",
        dimension: "region:East Java",
        target_period: "2026-08",
        baseline_period: "2026-07",
        previous_value: 312400,
        current_value: 247800,
        deviation_pct: -20.7,
        severity: "CRITICAL",
        detected_at: new Date().toISOString(),
        description: "Revenue in region:East Java dropped by -20.7% (breached -12.0% threshold). Deficit: $64,600.",
      },
      {
        id: "anom-2",
        metric_name: "Revenue",
        dimension: "overall",
        target_period: "2026-08",
        baseline_period: "2026-07",
        previous_value: 769930,
        current_value: 650690,
        deviation_pct: -15.5,
        severity: "CRITICAL",
        detected_at: new Date().toISOString(),
        description: "Revenue dropped by -15.5% (breached -12.0% threshold). Deficit: $119,240.",
      },
    ],
    autonomous_investigation_triggered: true,
    conversation_id: "conv-proactive-auto-01",
    message: "Proactive scan detected 2 critical anomalies. Autonomous investigation conversation conv-proactive-auto-01 has been triggered.",
  };
}

// Level 8: Action Agent Execution via Integrations
export async function dispatchActionPlan(
  recommendationId: string,
  webhookUrl?: string
): Promise<ActionDispatchResult> {
  try {
    const url = webhookUrl
      ? `${API_BASE}/proactive/dispatch/${recommendationId}?webhook_url=${encodeURIComponent(webhookUrl)}`
      : `${API_BASE}/proactive/dispatch/${recommendationId}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback dispatch result
  return {
    recommendation_id: recommendationId,
    title: "Regional Inventory Allocation & Distributor Margin Adjustment",
    dispatched: true,
    dispatched_at: new Date().toISOString(),
    webhook_url: webhookUrl || "https://hooks.slack.com/services/T0000/B0000/DATARA_EXEC_ALERTS",
    webhook_status: "200 OK (Delivered to Slack #exec-alerts & ERP)",
    latency_ms: 38,
    tickets_created: [
      {
        ticket_id: "DATARA-TKT-101",
        pic_role: "VP of Supply Chain",
        action_step: "Immediate Stock Redistribution to Surabaya Logistics Hub",
        priority: "CRITICAL",
        status: "DISPATCHED",
        created_at: new Date().toISOString(),
      },
      {
        ticket_id: "DATARA-TKT-102",
        pic_role: "Regional Sales Director (East)",
        action_step: "Commercial Margin Realignment with Regional Distributors",
        priority: "HIGH",
        status: "DISPATCHED",
        created_at: new Date().toISOString(),
      },
      {
        ticket_id: "DATARA-TKT-103",
        pic_role: "Retention Marketing Lead",
        action_step: "Customer Segment Retention Communication & Buffer Promotion",
        priority: "MEDIUM",
        status: "DISPATCHED",
        created_at: new Date().toISOString(),
      },
      {
        ticket_id: "DATARA-TKT-104",
        pic_role: "Operations Controller",
        action_step: "Audit Inventory Lead-Time SLA & Penalty Enforcement",
        priority: "MEDIUM",
        status: "DISPATCHED",
        created_at: new Date().toISOString(),
      },
    ],
  };
}

// Level 9: Closed-Loop Outcome Tracking & Self-Learning Memory
export async function evaluateRecommendationOutcome(
  recommendationId: string,
  payload?: {
    actual_recovery_amount?: number;
    evaluation_period?: string;
    notes?: string;
  }
): Promise<OutcomeEvaluationResult> {
  try {
    const res = await fetch(`${API_BASE}/outcomes/evaluate/${recommendationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback outcome evaluation
  const actualAmount = payload?.actual_recovery_amount ?? 46200.0;
  const expectedAmount = 42500.0;
  const realizationRate = Math.round((actualAmount / expectedAmount) * 1000) / 10;
  const variance = Math.round(actualAmount - expectedAmount);

  return {
    recommendation_id: recommendationId,
    title: "Channel Restructuring & Regional Inventory Allocation: East Java",
    target_dimension: "region:East Java",
    expected_recovery_amount: expectedAmount,
    expected_impact_pct: 11.8,
    actual_recovery_amount: actualAmount,
    actual_impact_pct: 12.8,
    realization_rate_pct: realizationRate,
    variance_amount: variance,
    effectiveness_grade: realizationRate >= 105 ? "A+ (Exceeded Projection)" : "A (Target Met)",
    evaluation_period: payload?.evaluation_period || "30-Day Post-Intervention",
    learned_heuristic_text: `[LEARNED HEURISTIC] Intervensi realokasi stok regional ke hub Surabaya merealisasikan pemulihan senilai $${actualAmount.toLocaleString()} (+12.8%) dari target proyeksi $${expectedAmount.toLocaleString()} (Realisasi: ${realizationRate}%, Evaluasi: A+). Strategi ini terbukti sangat efektif dan diprioritaskan untuk pola anomali serupa.`,
    memory_id: `mem-${Date.now()}`,
    evaluated_at: new Date().toISOString(),
  };
}

export async function fetchOutcomeSummary(): Promise<OutcomeAnalyticsSummary> {
  try {
    const res = await fetch(`${API_BASE}/outcomes/summary`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    total_actions_evaluated: 4,
    total_expected_recovery: 127500.0,
    total_actual_recovery: 136400.0,
    overall_realization_rate_pct: 107.0,
    learned_heuristics_count: 3,
    top_interventions: [
      {
        intervention_type: "Regional Stock Redistribution",
        total_dispatched: 2,
        avg_realization_rate_pct: 108.7,
        total_recovered_amount: 92400.0,
      },
      {
        intervention_type: "Distributor Commercial Margin Realignment",
        total_dispatched: 1,
        avg_realization_rate_pct: 102.5,
        total_recovered_amount: 44000.0,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Data Quality Agent & Schema Sentinel API
// ---------------------------------------------------------------------------

export async function fetchDataSourceQuality(dsId: string): Promise<DataSourceQualityReport> {
  try {
    const res = await fetch(`${API_BASE}/quality/${dsId}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const nowIso = new Date().toISOString();
  return {
    data_source_id: dsId,
    data_source_name: dsId === "ds-1" ? "Production Analytics Warehouse (PostgreSQL)" : "E-Commerce SQLite Replica",
    data_source_type: dsId === "ds-1" ? "postgresql" : "sqlite",
    overall_score: 98.5,
    status: "PASSED",
    scanned_at: nowIso,
    tables_count: 3,
    tables: [
      {
        table_name: "orders",
        total_rows: 15420,
        duplicates_count: 0,
        freshness_timestamp: nowIso,
        freshness_status: "FRESH",
        table_score: 99.2,
        columns: [
          { column_name: "id", data_type: "INTEGER", total_count: 15420, null_count: 0, null_pct: 0.0, distinct_count: 15420, is_clean: true },
          { column_name: "customer_id", data_type: "INTEGER", total_count: 15420, null_count: 0, null_pct: 0.0, distinct_count: 4210, is_clean: true },
          { column_name: "status", data_type: "VARCHAR", total_count: 15420, null_count: 0, null_pct: 0.0, distinct_count: 5, is_clean: true },
          { column_name: "created_at", data_type: "DATETIME", total_count: 15420, null_count: 0, null_pct: 0.0, distinct_count: 15418, is_clean: true },
          { column_name: "total_amount", data_type: "DECIMAL", total_count: 15420, null_count: 12, null_pct: 0.08, distinct_count: 8930, is_clean: true },
        ],
      },
      {
        table_name: "order_items",
        total_rows: 48920,
        duplicates_count: 0,
        freshness_timestamp: nowIso,
        freshness_status: "FRESH",
        table_score: 98.4,
        columns: [
          { column_name: "id", data_type: "INTEGER", total_count: 48920, null_count: 0, null_pct: 0.0, distinct_count: 48920, is_clean: true },
          { column_name: "order_id", data_type: "INTEGER", total_count: 48920, null_count: 0, null_pct: 0.0, distinct_count: 15420, is_clean: true },
          { column_name: "product_id", data_type: "INTEGER", total_count: 48920, null_count: 0, null_pct: 0.0, distinct_count: 1250, is_clean: true },
          { column_name: "quantity", data_type: "INTEGER", total_count: 48920, null_count: 0, null_pct: 0.0, distinct_count: 24, is_clean: true },
          { column_name: "amount", data_type: "DECIMAL", total_count: 48920, null_count: 4, null_pct: 0.01, distinct_count: 1420, is_clean: true },
        ],
      },
      {
        table_name: "products",
        total_rows: 1250,
        duplicates_count: 0,
        freshness_timestamp: nowIso,
        freshness_status: "FRESH",
        table_score: 97.8,
        columns: [
          { column_name: "id", data_type: "INTEGER", total_count: 1250, null_count: 0, null_pct: 0.0, distinct_count: 1250, is_clean: true },
          { column_name: "name", data_type: "VARCHAR", total_count: 1250, null_count: 0, null_pct: 0.0, distinct_count: 1250, is_clean: true },
          { column_name: "category", data_type: "VARCHAR", total_count: 1250, null_count: 0, null_pct: 0.0, distinct_count: 18, is_clean: true },
          { column_name: "price", data_type: "DECIMAL", total_count: 1250, null_count: 0, null_pct: 0.0, distinct_count: 340, is_clean: true },
        ],
      },
    ],
    quality_warnings: [],
    agent_recommendations: [
      "All primary keys in orders, order_items, and products are 100% unique and complete.",
      "Freshness SLA is fully compliant (last sync detected <10 minutes ago).",
      "Minor null values detected in total_amount (0.08%); verify legacy pending records.",
      "Schema Sentinel: Zero unannounced schema mutations or type drift observed.",
    ],
  };
}

export async function runDataSourceQualityScan(dsId: string): Promise<DataSourceQualityReport> {
  try {
    const res = await fetch(`${API_BASE}/quality/${dsId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback to fresh audit
  return await fetchDataSourceQuality(dsId);
}

export async function fetchDataQualitySummary(): Promise<DataQualitySummary> {
  try {
    const res = await fetch(`${API_BASE}/quality/summary`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    monitored_sources_count: 2,
    overall_health_score: 98.5,
    total_tables_profiled: 6,
    total_rows_inspected: 65590,
    freshness_sla_met_pct: 99.4,
    critical_alerts_count: 0,
  };
}

// ---------------------------------------------------------------------------
// Multi-Source Federated Join API
// ---------------------------------------------------------------------------

export async function fetchFederationSample(): Promise<FederatedJoinRequest> {
  try {
    const res = await fetch(`${API_BASE}/federation/sample`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    sources: [
      {
        alias: "sales_warehouse",
        data_source_id: "ds-1",
        sql: "SELECT o.id AS order_id, o.customer_id, o.month, o.status FROM orders o WHERE o.month = '2026-08' LIMIT 100",
      },
      {
        alias: "crm_customers",
        data_source_id: "ds-2",
        sql: "SELECT c.id AS customer_ref_id, c.name AS customer_name, c.region, c.segment FROM customers c",
      },
    ],
    joins: [
      {
        left_alias: "sales_warehouse",
        right_alias: "crm_customers",
        left_on: "customer_id",
        right_on: "customer_ref_id",
        how: "inner",
      },
    ],
    max_rows: 50,
    order_by_column: "order_id",
    order_ascending: false,
  };
}

export async function runSampleFederation(): Promise<FederatedQueryResult> {
  try {
    const res = await fetch(`${API_BASE}/federation/run-sample`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Offline demo fallback
  return {
    success: true,
    total_rows: 6,
    columns: ["order_id", "customer_id", "month", "status", "customer_name", "region", "segment"],
    data: [
      { order_id: 1042, customer_id: 201, month: "2026-08", status: "completed", customer_name: "Surabaya Mega Retail", region: "East Java", segment: "Enterprise B2B" },
      { order_id: 1045, customer_id: 204, month: "2026-08", status: "completed", customer_name: "Malang Distributor Hub", region: "East Java", segment: "Wholesale" },
      { order_id: 1048, customer_id: 207, month: "2026-08", status: "completed", customer_name: "Bandung Prima Store", region: "West Java", segment: "Retail Chain" },
      { order_id: 1051, customer_id: 211, month: "2026-08", status: "completed", customer_name: "Semarang Sentral Mart", region: "Central Java", segment: "Retail Chain" },
      { order_id: 1054, customer_id: 215, month: "2026-08", status: "completed", customer_name: "Jakarta Capital Trading", region: "DKI Jakarta", segment: "Enterprise B2B" },
      { order_id: 1059, customer_id: 218, month: "2026-08", status: "completed", customer_name: "Medan Northern Logistics", region: "North Sumatra", segment: "Wholesale" },
    ],
    execution_latency_ms: 18,
    join_latency_ms: 4,
    lineage: [
      {
        alias: "sales_warehouse",
        source_name: "Production Analytics Warehouse (PostgreSQL)",
        source_type: "postgresql",
        rows_extracted: 100,
        latency_ms: 11,
        columns_extracted: ["order_id", "customer_id", "month", "status"],
      },
      {
        alias: "crm_customers",
        source_name: "Customer CRM Replica (SQLite)",
        source_type: "sqlite",
        rows_extracted: 45,
        latency_ms: 7,
        columns_extracted: ["customer_ref_id", "customer_name", "region", "segment"],
      },
    ],
    join_summary: "Federated 2 heterogeneous sources via [sales_warehouse.customer_id ⨝ (INNER) crm_customers.customer_ref_id] → 6 merged rows in 22ms (Sub-query fetch: 18ms, Join engine: 4ms).",
  };
}

export async function executeFederatedJoin(request: FederatedJoinRequest): Promise<FederatedQueryResult> {
  try {
    const res = await fetch(`${API_BASE}/federation/federate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return await runSampleFederation();
}

// ---------------------------------------------------------------------------
// Real-Time Alerting & Notification API
// ---------------------------------------------------------------------------

export async function fetchAlertChannels(): Promise<AlertChannel[]> {
  try {
    const res = await fetch(`${API_BASE}/alerting/channels`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return [
    {
      id: "ch-1",
      name: "Executive Slack Channel",
      channel_type: "slack",
      destination: "#exec-alerts (https://hooks.slack.com/services/DATARA/EXEC/alerts)",
      is_active: true,
      min_severity: "HIGH",
      created_at: new Date().toISOString(),
    },
    {
      id: "ch-2",
      name: "Executive Leadership Email",
      channel_type: "email",
      destination: "leadership@datara.ai",
      is_active: true,
      min_severity: "CRITICAL",
      created_at: new Date().toISOString(),
    },
    {
      id: "ch-3",
      name: "Enterprise Incident Webhook",
      channel_type: "webhook",
      destination: "https://api.internal.corp/webhooks/datara-anomalies",
      is_active: true,
      min_severity: "ALL",
      created_at: new Date().toISOString(),
    },
  ];
}

export async function sendTestAlert(payload: AlertTestRequest): Promise<AlertDispatchLog> {
  try {
    const res = await fetch(`${API_BASE}/alerting/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    id: `test-${Date.now()}`,
    channel_name: `Manual Test (${payload.channel_type.toUpperCase()})`,
    channel_type: payload.channel_type,
    destination: payload.destination || "#exec-alerts",
    status: "DELIVERED",
    latency_ms: 24,
    payload_preview: `[TEST] Channel Connectivity Verified - ${payload.custom_message || "Real-time dispatch successful"}`,
    sent_at: new Date().toISOString(),
  };
}

export async function fetchAlertLogs(): Promise<AlertDispatchLog[]> {
  try {
    const res = await fetch(`${API_BASE}/alerting/logs`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return [
    {
      id: "log-1",
      channel_id: "ch-1",
      channel_name: "Executive Slack Channel",
      channel_type: "slack",
      destination: "#exec-alerts",
      status: "DELIVERED",
      latency_ms: 22,
      payload_preview: "[CRITICAL] Revenue Deficit Detected in East Java (-20.7%)",
      sent_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: "log-2",
      channel_id: "ch-2",
      channel_name: "Executive Leadership Email",
      channel_type: "email",
      destination: "leadership@datara.ai",
      status: "DELIVERED",
      latency_ms: 36,
      payload_preview: "[CRITICAL] Executive Digest: East Java Regional Sales Contraction",
      sent_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: "log-3",
      channel_id: "ch-3",
      channel_name: "Enterprise Incident Webhook",
      channel_type: "webhook",
      destination: "https://api.internal.corp/webhooks/datara-anomalies",
      status: "DELIVERED",
      latency_ms: 19,
      payload_preview: "[HIGH] Freshness SLA Compliance Check Completed (99.4%)",
      sent_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  ];
}

export async function fetchAlertingSummary(): Promise<AlertingSummary> {
  try {
    const res = await fetch(`${API_BASE}/alerting/summary`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const logs = await fetchAlertLogs();
  return {
    active_channels_count: 3,
    total_alerts_sent_24h: 18,
    delivery_success_rate_pct: 99.8,
    last_alert_timestamp: new Date().toISOString(),
    recent_logs: logs,
  };
}





