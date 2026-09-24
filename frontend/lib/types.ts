export interface DriverItem {
  dimension: string;
  value: string;
  impact_pct: number;
  previous_val?: number;
  current_val?: number;
}

export interface ToolCall {
  id: string;
  analysis_step_id: string;
  tool_name: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  executed_sql?: string | null;
  latency_ms?: number | null;
  status: string;
  created_at: string;
}

export interface AnalysisStep {
  id: string;
  conversation_id: string;
  step_order: number;
  title: string;
  description?: string | null;
  status: "pending" | "in_progress" | "completed" | "failed";
  duration_ms?: number | null;
  result_summary?: string | null;
  created_at: string;
  tool_calls: ToolCall[];
}

export interface Insight {
  id: string;
  conversation_id: string;
  finding: string;
  evidence: string;
  evidence_rows: number;
  calculation: string;
  confidence: number;
  main_drivers: DriverItem[];
  data_source: string;
  created_at: string;
}

export interface ActionStepItem {
  id: number;
  step: string;
  pic_role: string;
  completed: boolean;
}

export interface Recommendation {
  id: string;
  conversation_id: string;
  title: string;
  rationale: string;
  target_dimension?: string;
  estimated_impact_amount: number;
  estimated_impact_pct: number;
  confidence: number;
  priority: string; // "P0 - Critical", "P1 - High", "P2 - Medium"
  difficulty: string; // "Low", "Medium", "Hard"
  action_steps: ActionStepItem[];
  status: "pending_approval" | "approved" | "rejected" | "in_progress";
  created_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  user_id: string;
  goal_or_question: string;
  status: "planning" | "analyzing" | "completed" | "failed";
  created_at: string;
  steps: AnalysisStep[];
  insights: Insight[];
  recommendations?: Recommendation[];
}

export interface SemanticMetric {
  id: string;
  organization_id: string;
  name: string;
  formula: string;
  source_table: string;
  owner: string;
  refresh_frequency: string;
  allowed_dimensions: string[];
  business_terms: string[];
  business_rules?: string | null;
  created_at: string;
}

export interface AgentMemory {
  id: string;
  organization_id: string;
  instruction_text: string;
  category: string;
  added_by: string;
  created_at: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  allowed_datasets: string[];
  restricted_fields: string[];
  created_at: string;
}

export interface AuditStep {
  step_order: number;
  title: string;
  description?: string;
  status: string;
  duration_ms?: number;
  result_summary?: string;
  tool_calls: {
    id: string;
    tool_name: string;
    arguments: Record<string, any>;
    executed_sql?: string;
    latency_ms?: number;
    status: string;
    created_at: string;
  }[];
}

export interface AuditTrail {
  conversation_id: string;
  total_steps: number;
  total_tool_calls: number;
  total_sql_latency_ms: number;
  steps: AuditStep[];
}

export type DataSourceType = "postgres" | "postgresql" | "mysql" | "sqlite" | "supabase" | "csv_upload" | "bigquery" | "snowflake";

export interface DataSource {
  id: string;
  organization_id: string;
  name: string;
  type: DataSourceType;
  connection_meta: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    database_url?: string;
    file_path?: string;
    file_name?: string;
    tables_count?: number;
    last_synced?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface DataSourceTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  tables?: string[];
}

// Level 5: What-If Scenario & Forecasting Types
export interface ForecastTrajectoryPoint {
  period_label: string;
  is_projected: boolean;
  status_quo_value: number;
  mitigated_value: number;
}

export interface DriverInterventionItem {
  dimension: string;
  driver_name: string;
  deficit_amount: number;
  intervention_pct: number;
  recovered_amount: number;
}

export interface ForecastScenarioResponse {
  metric_name: string;
  baseline_value: number;
  current_value: number;
  trajectory: ForecastTrajectoryPoint[];
  driver_interventions: DriverInterventionItem[];
  next_period_status_quo: number;
  next_period_mitigated: number;
  net_protected_value: number;
  recovery_percentage: number;
  confidence_score: number;
  narrative_summary: string;
}

// Phase 3: Proactive Monitoring & Action Agent Types
export interface AnomalyItem {
  id: string;
  metric_name: string;
  dimension?: string;
  target_period: string;
  baseline_period: string;
  previous_value: number;
  current_value: number;
  deviation_pct: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  detected_at: string;
  description: string;
}

export interface ProactiveScanResult {
  anomalies_detected: AnomalyItem[];
  autonomous_investigation_triggered: boolean;
  conversation_id?: string | null;
  message: string;
}

export interface DepartmentTicket {
  ticket_id: string;
  pic_role: string;
  action_step: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface ActionDispatchResult {
  recommendation_id: string;
  title: string;
  dispatched: boolean;
  webhook_url: string;
  webhook_status: string;
  latency_ms: number;
  tickets_created: DepartmentTicket[];
  dispatched_at: string;
}

export interface ProactiveStatusResponse {
  watcher_status: string;
  last_scan_at: string;
  monitored_metrics_count: number;
  recent_anomalies_count: number;
  recent_anomalies: AnomalyItem[];
}

// Level 9: Closed-Loop Outcome Tracking & Self-Learning Memory Types
export interface OutcomeEvaluationResult {
  recommendation_id: string;
  title: string;
  target_dimension: string;
  expected_recovery_amount: number;
  expected_impact_pct: number;
  actual_recovery_amount: number;
  actual_impact_pct: number;
  realization_rate_pct: number;
  variance_amount: number;
  effectiveness_grade: string;
  evaluation_period: string;
  learned_heuristic_text: string;
  memory_id?: string | null;
  evaluated_at: string;
}

export interface InterventionMetricSummary {
  intervention_type: string;
  total_dispatched: number;
  avg_realization_rate_pct: number;
  total_recovered_amount: number;
}

export interface OutcomeAnalyticsSummary {
  total_actions_evaluated: number;
  total_expected_recovery: number;
  total_actual_recovery: number;
  overall_realization_rate_pct: number;
  learned_heuristics_count: number;
  top_interventions: InterventionMetricSummary[];
}

// Data Quality Agent & Schema Sentinel Types
export interface ColumnQualityProfile {
  column_name: string;
  data_type: string;
  total_count: number;
  null_count: number;
  null_pct: number;
  distinct_count: number;
  is_clean: boolean;
}

export interface TableQualityReport {
  table_name: string;
  total_rows: number;
  duplicates_count: number;
  freshness_timestamp: string;
  freshness_status: "FRESH" | "ACCEPTABLE" | "STALE" | string;
  table_score: number;
  columns: ColumnQualityProfile[];
}

export interface DataSourceQualityReport {
  data_source_id: string;
  data_source_name: string;
  data_source_type: string;
  overall_score: number;
  status: "PASSED" | "WARNING" | "CRITICAL" | string;
  scanned_at: string;
  tables_count: number;
  tables: TableQualityReport[];
  quality_warnings: string[];
  agent_recommendations: string[];
}

export interface DataQualitySummary {
  monitored_sources_count: number;
  overall_health_score: number;
  total_tables_profiled: number;
  total_rows_inspected: number;
  freshness_sla_met_pct: number;
  critical_alerts_count: number;
}

// Multi-Source Federated Join Types
export interface FederatedSourceQuery {
  alias: string;
  data_source_id?: string | null;
  sql: string;
  restricted_fields?: string[];
}

export interface FederatedJoinClause {
  left_alias: string;
  right_alias: string;
  left_on: string;
  right_on: string;
  how: "inner" | "left" | "right" | "outer" | string;
}

export interface FederatedJoinRequest {
  sources: FederatedSourceQuery[];
  joins: FederatedJoinClause[];
  max_rows?: number;
  order_by_column?: string | null;
  order_ascending?: boolean;
}

export interface FederatedSourceLineage {
  alias: string;
  source_name: string;
  source_type: string;
  rows_extracted: number;
  latency_ms: number;
  columns_extracted: string[];
}

export interface FederatedQueryResult {
  success: boolean;
  total_rows: number;
  columns: string[];
  data: Record<string, any>[];
  execution_latency_ms: number;
  join_latency_ms: number;
  lineage: FederatedSourceLineage[];
  join_summary: string;
  error_message?: string | null;
}

// Real-Time Alerting & Notification Types
export interface AlertChannel {
  id: string;
  name: string;
  channel_type: "slack" | "email" | "webhook" | string;
  destination: string;
  is_active: boolean;
  min_severity: "ALL" | "HIGH" | "CRITICAL" | string;
  created_at: string;
}

export interface AlertChannelCreate {
  name: string;
  channel_type: string;
  destination: string;
  is_active?: boolean;
  min_severity?: string;
}

export interface AlertNotificationPayload {
  title: string;
  severity: "INFO" | "HIGH" | "CRITICAL" | string;
  category: "METRIC_ANOMALY" | "DATA_QUALITY" | "ACTION_APPROVED" | string;
  message: string;
  metrics_summary?: string | null;
  details?: Record<string, any> | null;
  action_url?: string | null;
  source_system?: string;
  timestamp: string;
}

export interface AlertDispatchLog {
  id: string;
  channel_id?: string | null;
  channel_name: string;
  channel_type: string;
  destination: string;
  status: "DELIVERED" | "SIMULATED" | "FAILED" | string;
  latency_ms: number;
  payload_preview: string;
  sent_at: string;
}

export interface AlertTestRequest {
  channel_type: string;
  destination?: string | null;
  custom_message?: string | null;
}

export interface AlertingSummary {
  active_channels_count: number;
  total_alerts_sent_24h: number;
  delivery_success_rate_pct: number;
  last_alert_timestamp?: string | null;
  recent_logs: AlertDispatchLog[];
}






