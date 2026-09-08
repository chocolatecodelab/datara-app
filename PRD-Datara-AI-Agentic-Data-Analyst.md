# Product Requirements Document (PRD)
# Datara — AI Agentic Data Analyst

| | |
|---|---|
| **Product Name** | Datara |
| **Tagline** | Ask → Investigate → Explain → Predict → Recommend → Act |
| **Positioning** | Bukan "ChatGPT for SQL", bukan "AI Dashboard Generator" — Datara adalah AI Data Analyst yang mengambil alih pekerjaan analyst, bukan sekadar membuat chart dari pertanyaan. |
| **Document Version** | 1.0 |
| **Status** | Draft — MVP Definition |
| **Owner** | Product & Engineering |
| **Last Updated** | 29 Agustus 2026 |

---

## 1. Ringkasan Eksekutif

**Datara** adalah platform AI Agentic Data Analyst yang tidak berhenti pada "menjawab pertanyaan tentang data", tetapi bergerak melalui rantai nilai penuh seorang analyst manusia:

```
Ask  →  Investigate  →  Explain  →  Predict  →  Recommend  →  Act
```

Perbedaan Datara dari chatbot-analytics generik terletak pada tiga kemampuan inti yang dijadikan **fokus pembeda produk**:

1. **Autonomous Investigation** — user memberi *goal* ("cari tahu kenapa revenue turun"), bukan instruksi langkah demi langkah; agent menyusun analytical plan sendiri dan mengeksekusinya.
2. **Proactive Business Monitoring** — Datara tidak menunggu ditanya; ia memantau metrik bisnis, mendeteksi anomali, dan menginvestigasi sendiri sebelum user sadar ada masalah.
3. **Insight → Recommendation → Action** — insight tidak berhenti sebagai temuan; Datara menyusun rekomendasi yang auditable dan, dengan persetujuan manusia, dapat menjalankan tindakan nyata lewat integrasi (ERP, CRM, email, webhook).

Governance, semantic layer, dan auditability dibangun **sejak MVP**, bukan ditambahkan belakangan — karena itulah yang membedakan enterprise AI yang dipercaya dari sekadar demo yang terlihat keren.

---

## 2. Latar Belakang & Masalah

### 2.1 Kondisi pasar

Kemampuan "tanya database pakai bahasa natural" sudah mulai menjadi fitur standar di platform data besar — Microsoft Fabric dan Databricks kini menyediakan data agent bawaan yang melakukan natural-language analytics dengan semantic context, governance, SQL, dan visualisasi. Databricks secara eksplisit menekankan pentingnya semantic definitions, relationship, SQL expression, dan business terminology agar kualitas agent meningkat, sementara Microsoft membedakan *data agent* (menjawab pertanyaan) dari *operations agent* (memonitor kondisi dan memicu tindakan) — dan menekankan agent harus tunduk pada permission/governance data yang sudah berlaku di organisasi.

**Implikasi:** kalau Datara hanya "chatbot yang bisa bikin grafik", ia bersaing di kategori yang sedang dikomoditisasi oleh platform besar. Datara perlu naik satu level ke kategori *autonomous analyst* — investigasi, prediksi, rekomendasi, dan tindakan — yang jauh lebih sulit ditiru sebagai fitur tambahan semata.

### 2.2 Masalah yang dipecahkan

| Masalah | Kondisi saat ini | Yang diinginkan |
|---|---|---|
| Analyst menghabiskan waktu untuk investigasi manual berulang | Root cause dicari manual lewat drill-down spreadsheet | Agent melakukan drill-down otomatis dan menjelaskan kontribusi tiap faktor |
| Masalah bisnis baru diketahui setelah terlambat | Dashboard bersifat pasif, menunggu dibuka | Agent memonitor terus-menerus dan mengirim alert proaktif |
| Insight berhenti di laporan, tidak berlanjut ke tindakan | Rekomendasi disampaikan manual di rapat | Rekomendasi disertai expected impact & confidence, dapat langsung dieksekusi via approval |
| Definisi metrik bisnis tidak konsisten antar tim | Setiap orang punya definisi "revenue" sendiri | Semantic layer terpusat sebagai satu-satunya sumber kebenaran metrik |
| AI enterprise sulit dipercaya | Jawaban AI tidak bisa ditelusuri asal-usulnya | Setiap insight punya evidence, calculation, confidence, dan audit trail |

---

## 3. Tujuan Produk

### 3.1 Goals

| # | Goal |
|---|---|
| G1 | User dapat bertanya dalam bahasa natural dan mendapat jawaban bisnis (bukan SQL mentah) lengkap dengan evidence dan angka. |
| G2 | Agent dapat menyusun *analytical plan* secara otomatis dari sebuah goal terbuka, lalu mengeksekusinya tanpa diarahkan langkah demi langkah. |
| G3 | Agent dapat melakukan root cause analysis dengan drill-down otomatis lintas dimensi (region, product, segment, dst.) dan mengurutkan kontributor berdasarkan besar dampak. |
| G4 | Semua metrik bisnis (revenue, churn, margin, dst.) didefinisikan satu kali di semantic layer dan menjadi rujukan tunggal seluruh analisis agent. |
| G5 | Setiap insight yang dihasilkan bersifat *explainable*: finding, evidence, calculation, confidence, dan data source selalu tersedia. |
| G6 | Akses data dan hasil analisis mengikuti role-based access control dan field-level security sejak MVP — bukan retrofit. |
| G7 | Setiap keputusan agent (pertanyaan → plan → tools → SQL → hasil → rekomendasi) tercatat dalam audit trail yang dapat ditelusuri manusia. |
| G8 (Fase lanjut) | Agent dapat memonitor metrik bisnis secara proaktif, mendeteksi anomali, dan menginvestigasi otomatis sebelum user bertanya. |
| G9 (Fase lanjut) | Rekomendasi dapat ditindaklanjuti menjadi *action* nyata (mis. purchase request, campaign trigger) melalui integrasi eksternal, dengan human approval untuk tindakan konsekuensial. |

### 3.2 Non-Goals (Out of Scope untuk MVP)

- Multi-agent orchestration penuh (Data/SQL/Analyst/Forecast/Recommendation/Action agent terpisah) — MVP menggunakan satu agent dengan tahapan internal yang jelas, mengikuti prinsip yang sama dengan pendekatan Nexora.
- Action Agent yang mengeksekusi tindakan otomatis ke sistem eksternal (ERP/CRM/webhook) — MVP berhenti di rekomendasi; eksekusi tindakan masuk fase lanjut dengan human approval wajib.
- Proactive monitoring & anomaly alerting real-time — masuk fase lanjut setelah core analysis loop terbukti akurat.
- Forecasting/what-if scenario dengan model ML kompleks — MVP memakai time-series/regression sederhana bila diperlukan, bukan model custom.
- Multi-source data agent penuh (join otomatis lintas CRM/ERP/marketing platform) — MVP fokus pada satu/dua sumber data terstruktur (PostgreSQL/warehouse + spreadsheet upload).
- Data Quality Agent otomatis penuh — MVP menyediakan quality check dasar saat data dihubungkan, bukan monitoring quality berkelanjutan.

---

## 4. Target Pengguna & Persona

| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Business User / Manager** | Tidak bisa SQL, butuh jawaban cepat tentang performa bisnis. | Bertanya bahasa natural, jawaban dalam bahasa bisnis, bukan tabel mentah. |
| **Data Analyst** | Sudah bisa SQL, tapi lelah mengerjakan investigasi/drill-down repetitif. | Agent yang bisa diberi *goal* terbuka, hasil yang bisa diverifikasi (evidence, SQL yang digunakan). |
| **Data/Analytics Lead** | Bertanggung jawab atas konsistensi metrik & governance data. | Semantic layer terpusat, RBAC, audit trail sebelum mengizinkan adopsi luas. |
| **Executive (CEO/Finance Head)** | Butuh insight strategis, bukan detail teknis. | Ringkasan proaktif, rekomendasi dengan expected impact, tanpa perlu bertanya. |

### User Stories Inti (MVP)

- Sebagai business user, saya ingin bertanya *"Kenapa revenue bulan ini turun?"* dan mendapat jawaban naratif dengan angka pendukung, bukan tabel SQL.
- Sebagai analyst, saya ingin memberi goal terbuka *"cari tahu penyebab penurunan sales"* dan melihat agent menyusun serta menjalankan analytical plan-nya sendiri.
- Sebagai analyst, saya ingin melihat *root cause breakdown* — kontributor mana (produk, region, segmen) yang paling besar dampaknya terhadap perubahan metrik.
- Sebagai data lead, saya ingin mendefinisikan metrik bisnis ("Revenue", "Churn") satu kali di semantic layer, dan memastikan semua jawaban agent memakai definisi tersebut secara konsisten.
- Sebagai data lead, saya ingin membatasi akses data per role (mis. tim Marketing tidak melihat data Finance) sebelum produk ini digunakan lintas divisi.
- Sebagai siapa pun, saya ingin setiap jawaban agent bisa saya periksa: dari mana datanya, bagaimana perhitungannya, seberapa yakin agent terhadap jawaban ini.
- Sebagai admin, saya ingin melihat audit trail lengkap dari sebuah percakapan: pertanyaan → plan → tools yang dipanggil → SQL yang dijalankan → kesimpulan.

---

## 5. Positioning & Progression Level

Datara diukur bukan dari "berapa banyak chart yang bisa dibuat", melainkan **berapa banyak pekerjaan analyst yang bisa diambil alih**. Progression ini menjadi kerangka roadmap produk:

```
LEVEL 1   Ask Data                    ← MVP
LEVEL 2   Generate Analysis           ← MVP
LEVEL 3   Find Insights               ← MVP
LEVEL 4   Find Root Cause             ← MVP
LEVEL 5   Predict                     ← Fase 2
LEVEL 6   Recommend                   ← Fase 2
LEVEL 7   Monitor (proactive)         ← Fase 3
LEVEL 8   Take Action                 ← Fase 3
LEVEL 9   Learn From Outcomes         ← Fase 4
```

Level 7–9 adalah titik di mana Datara benar-benar menjadi *agentic data analyst*, bukan sekadar "AI BI tool" — tetapi MVP sengaja dibatasi ke Level 1–4 agar fondasi (semantic layer, governance, explainability) solid sebelum menambah otonomi.

---

## 6. Core Loop (Arsitektur Alur)

```
                ┌──────────────────┐
                │ Business Question │  ("Kenapa revenue turun?"
                │   / Open Goal      │   atau "Cari tahu kenapa sales drop")
                └────────┬──────────┘
                         ↓
                ┌──────────────────┐
                │ Intent Detection │
                └────────┬──────────┘
                         ↓
                ┌──────────────────┐
                │ Analysis Planner │  → menyusun analytical plan bertahap
                └────────┬──────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                 ↓
  Data Discovery                   Semantic Layer
  (tabel/kolom relevan)            (definisi metrik & dimensi resmi)
        ↓                                 ↓
        └────────────────┬────────────────┘
                         ↓
                  SQL / Python Execution (sandbox)
                         ↓
                   Data Analysis
                         ↓
                ┌────────┴────────┐
                ↓                 ↓
          Root Cause         Forecasting (fase 2)
                ↓                 ↓
                └────────┬────────┘
                         ↓
                  Insight Engine        → finding + evidence + confidence
                         ↓
                 Recommendation (fase 2) → expected impact + confidence
                         ↓
                 Human Approval (untuk action, fase 3)
                         ↓
                   Action Tools (fase 3)
                         ↓
                 Outcome Tracking (fase 4)
                         ↓
                   Agent Memory          → business instruction disimpan
```

**MVP mencakup jalur dari "Business Question" sampai "Insight Engine".** Jalur setelah Insight Engine (Recommendation, Action, Outcome Tracking) masuk fase lanjut sesuai roadmap bagian 14.

---

## 7. Lingkup MVP (Scope)

### 7.1 Fitur MVP

| Modul | Deskripsi |
|---|---|
| **Data Source Connection** | Menghubungkan satu sumber data terstruktur (PostgreSQL/data warehouse) dan/atau upload CSV/Excel. |
| **Semantic Layer (dasar)** | Definisi metrik & dimensi inti (mis. Revenue, Order, Customer, Region) dengan formula, source table, dan business terminology mapping ("omzet" → Revenue). |
| **Ask Data (Natural Language → Answer)** | User bertanya bahasa natural → intent detection → SQL generation → eksekusi → jawaban naratif berbahasa bisnis dengan angka pendukung. |
| **Autonomous Analysis Planner** | Dari goal terbuka, agent menyusun analytical plan (list langkah investigasi) dan menampilkannya ke user sebelum/selagi dieksekusi. |
| **Root Cause / Drill-down Engine** | Breakdown otomatis metrik berdasarkan dimensi yang tersedia (produk, region, segmen), diurutkan berdasarkan kontribusi terhadap perubahan. |
| **Explainable Insight Card** | Setiap jawaban menyertakan: finding, evidence (jumlah data yang dianalisis), calculation (formula yang dipakai), confidence, dan data source. |
| **Role-Based Access Control (dasar)** | Role (Admin, Analyst, Viewer) menentukan sumber data dan dataset yang bisa diakses; field-level security untuk kolom sensitif. |
| **Audit Trail** | Setiap sesi tanya-jawab mencatat: pertanyaan, plan, tool calls, SQL yang dijalankan, dan kesimpulan — dapat ditelusuri admin. |
| **Agent Memory (dasar)** | Business instruction yang diberikan user (mis. "revenue kami tidak termasuk pajak") disimpan dan dipakai konsisten di analisis berikutnya. |
| **Conversation Dashboard** | Riwayat percakapan/analisis, dapat dibuka ulang, hasil dapat di-pin/disimpan sebagai referensi. |

### 7.2 Eksplisit Tidak Termasuk MVP

Lihat bagian **3.2 Non-Goals**.

---

## 8. Spesifikasi Fitur Detail

### 8.1 Ask Data — Natural Language → Business Analysis

Alur pemrosesan pertanyaan:

```
User Question
      ↓
Understand Intent
      ↓
Identify Business Metrics (via Semantic Layer)
      ↓
Find Relevant Data
      ↓
Generate SQL
      ↓
Execute Query (sandbox read-only)
      ↓
Analyze Results
      ↓
Generate Insight
      ↓
Explain Answer (bahasa bisnis, bukan tabel mentah)
```

**Contoh output yang diharapkan** (gaya bahasa, bukan klaim data riil):

> Revenue turun 12,4% dibanding bulan sebelumnya. Penyebab utamanya adalah penurunan penjualan Produk A sebesar 19%, terutama di wilayah Jawa Timur, yang menyumbang sekitar 68% dari total penurunan revenue.

### 8.2 Autonomous Analysis Planner

Untuk goal terbuka (bukan pertanyaan spesifik), agent menyusun plan eksplisit yang **ditampilkan ke user** sebelum eksekusi penuh — mengikuti prinsip transparansi yang sama dengan Human Approval Gate di Nexora.

Contoh plan untuk goal *"Cari tahu kenapa sales turun"*:

```
ANALYSIS PLAN

1. Compare current vs previous period
2. Break down revenue by region
3. Break down revenue by product
4. Analyze customer segments
5. Analyze transaction volume
6. Check average order value
7. Detect abnormal changes
8. Identify strongest contributors
9. Validate findings
10. Generate recommendation
```

Agent kemudian mengeksekusi tahapan ini secara berurutan dan melaporkan progres — bukan black box yang langsung memberi jawaban akhir.

### 8.3 Root Cause Analysis

Setelah anomali/perubahan metrik terdeteksi, agent melakukan drill-down otomatis dan mengurutkan kontributor berdasarkan besar dampak:

```
Revenue ↓ 15%

Kontributor utama:
1. Produk A       ↓22%   kontribusi 42%
2. Jawa Timur     ↓18%   kontribusi 31%
3. Returning cust ↓14%   kontribusi 19%
```

Drill-down path bersifat rekursif — agent dapat melanjutkan dari satu dimensi ke dimensi berikutnya (region → produk → segmen → frekuensi transaksi) sampai kontributor paling granular ditemukan atau batas kedalaman tercapai.

### 8.4 Semantic Layer (Enterprise Knowledge Layer)

LLM tidak boleh membaca skema database mentah (`orders`, `customers`, `products`) sebagai satu-satunya konteks. Semantic layer menjembatani istilah bisnis ke definisi teknis:

```
Business Concepts → Metrics → Dimensions → Relationships → Business Rules → Agent
```

Contoh entri semantic layer:

```yaml
metric: Revenue
formula: SUM(order_items.amount)
source_table: order_items
owner: finance_team
refresh_frequency: daily
allowed_dimensions: [region, product, customer_segment, date]
business_terms: ["sales", "revenue", "omzet"]
business_rules:
  - "Revenue excludes tax unless stated otherwise"
```

**Semantic layer adalah prasyarat, bukan fitur opsional** — seluruh SQL generation dan jawaban agent wajib merujuk definisi di sini, agar konsisten lintas percakapan dan lintas user.

### 8.5 Explainable Analysis

Setiap insight yang ditampilkan wajib memiliki lima komponen berikut, ditampilkan sebagai satu kartu terstruktur (bukan teks bebas panjang):

| Komponen | Contoh |
|---|---|
| **Finding** | Revenue turun 12% |
| **Evidence** | Dianalisis dari 72.481 transaksi |
| **Calculation** | Revenue = SUM(order_value) |
| **Main drivers** | Produk A: kontribusi -42%; Wilayah Timur: -31% |
| **Confidence** | 87% |
| **Data source** | PostgreSQL / sales database |

### 8.6 Agent Memory (dasar)

Business instruction yang diberikan user secara eksplisit disimpan sebagai *fact* yang mempengaruhi analisis berikutnya:

> "Untuk perusahaan kami, revenue tidak termasuk pajak."
> "Management menganggap customer tidak aktif setelah 60 hari."

Fact ini disimpan per-organisasi (bukan per-user) di database, ditandai siapa yang menambahkan dan kapan, dan dapat ditinjau/dihapus oleh Data Lead — untuk mencegah agent "belajar" instruksi yang salah tanpa jejak.

### 8.7 Role-Based Access Control & Field-Level Security

```
CEO      → seluruh metrik perusahaan
Finance  → data finansial
Marketing → data marketing + customer (terbatas)
Sales    → data sales
HR       → data karyawan
```

Kolom sensitif (mis. gaji, data pribadi pelanggan) ditandai *field-level restricted* dan disaring di level query generation — agent tidak boleh menyusun SQL yang menyentuh kolom di luar izin role yang sedang bertanya, bahkan jika secara teknis kolom itu ada di tabel yang sama.

### 8.8 Audit Trail

```
User Question → Agent Plan → Tools Called → SQL Generated
→ Data Sources → Analysis → Conclusion → (Recommendation → Action, fase lanjut)
```

Admin dapat menelusuri *mengapa* sebuah kesimpulan/rekomendasi muncul, tanpa perlu mengekspos chain-of-thought internal model — cukup jejak tool call dan SQL yang benar-benar dieksekusi.

---

## 9. Arsitektur Teknis

### 9.1 Prinsip Desain

1. **Semantic layer sebagai gerbang wajib** — agent tidak pernah menyusun SQL langsung dari skema mentah tanpa melalui definisi semantic layer.
2. **Read-only execution di MVP** — agent hanya menjalankan query baca; tidak ada write/DDL ke sumber data pelanggan.
3. **Governance sejak hari pertama** — RBAC dan field-level security bukan fitur v2, melainkan bagian dari MVP.
4. **Explainability built-in** — setiap respons wajib membawa evidence & confidence, bukan opsional tambahan di UI.
5. **Single agent, staged pipeline di MVP** — mengikuti prinsip yang sama dengan Nexora: multi-agent orchestration ditunda sampai pipeline dasar stabil dan teruji.
6. **Lean infrastructure** — hindari vector database, Kafka, Kubernetes, atau ML platform khusus sampai benar-benar diperlukan skala nyata.

### 9.2 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend / Agent Engine | Python, FastAPI |
| Query & Analysis Execution | Sandbox terisolasi menjalankan SQL (read-only) dan Python (pandas) untuk agregasi/statistik |
| Database (state & metadata) | Supabase (PostgreSQL) — menyimpan semantic layer, conversation, audit trail, bukan data bisnis pelanggan |
| Data Source (MVP) | Koneksi read-only ke PostgreSQL/warehouse pelanggan, dan/atau upload CSV/Excel |
| LLM | Gemini API (konsisten dengan pendekatan model routing: model cepat untuk intent detection/klasifikasi, model kuat untuk plan generation & analisis kompleks) |
| Hosting Frontend | Vercel |
| Hosting Backend | Google Cloud Run |

### 9.3 Diagram Arsitektur (MVP)

```
                         ┌─────────────┐
                         │    User     │
                         └──────┬──────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │      Vercel      │
                     │     Next.js      │
                     │  Chat/Dashboard  │
                     └────────┬─────────┘
                              │ HTTPS
                              ▼
                     ┌──────────────────┐
                     │    Cloud Run     │
                     │     FastAPI      │
                     │   Agent Engine   │
                     └──┬────┬────┬─────┘
                        │    │    │
        ┌───────────────┘    │    └───────────────┐
        ▼                    ▼                    ▼
 ┌─────────────┐     ┌──────────────┐     ┌───────────────┐
 │  Supabase   │     │  Gemini API  │     │ Customer Data │
 │ (semantic   │     │ (reasoning)  │     │ Source        │
 │  layer,     │     │              │     │ (read-only:   │
 │  audit,     │     │              │     │ PG/warehouse/ │
 │  memory)    │     │              │     │ CSV upload)   │
 └─────────────┘     └──────────────┘     └───────┬───────┘
                                                    ▼
                                            ┌───────────────┐
                                            │ Query/Analysis│
                                            │    Sandbox    │
                                            │ (SQL + pandas)│
                                            └───────────────┘
```

### 9.4 Data Discovery & Query Generation — Tool Design

Agent bekerja lewat tools terbatas, bukan akses bebas ke seluruh skema:

| Tool | Fungsi |
|---|---|
| `lookup_metric(name)` | Mencari definisi metrik di semantic layer (formula, source, allowed dimensions). |
| `search_schema(query)` | Mencari tabel/kolom relevan terhadap pertanyaan, dibatasi oleh RBAC user. |
| `generate_sql(intent, metric, dimensions)` | Menyusun SQL berdasarkan definisi semantic layer, bukan skema mentah. |
| `execute_query(sql)` | Menjalankan query read-only di sandbox, dengan row-limit & timeout. |
| `run_analysis(dataframe, method)` | Analisis statistik dasar (agregasi, breakdown kontribusi, deteksi outlier) via pandas. |

### 9.5 Query Sandbox Constraints

Sama seperti prinsip sandbox di Nexora, eksekusi query/analisis dibatasi:
- Read-only (tidak ada INSERT/UPDATE/DELETE/DDL)
- Row limit & query timeout
- Row-level filtering otomatis sesuai RBAC sebelum hasil dikembalikan ke agent
- Log setiap query yang dieksekusi untuk audit trail

---

## 10. Data Model (Supabase — State & Metadata)

Supabase menyimpan **semantic layer, metadata, dan state percakapan** — bukan salinan data bisnis pelanggan (yang tetap berada di sumber data asli).

```sql
-- organizations
organizations
├── id
├── name
├── created_at

-- data_sources: koneksi ke sumber data pelanggan
data_sources
├── id
├── organization_id (FK)
├── type              -- postgres, csv_upload, dst.
├── connection_meta (jsonb, tanpa credential mentah tersimpan plaintext)
├── created_at

-- semantic_metrics: definisi metrik bisnis
semantic_metrics
├── id
├── organization_id (FK)
├── name              -- "Revenue"
├── formula
├── source_table
├── owner
├── allowed_dimensions (jsonb)
├── business_terms (jsonb)  -- ["sales", "omzet"]
├── business_rules (text)

-- roles & access
roles
├── id
├── organization_id (FK)
├── name              -- Admin, Analyst, Viewer, dst.
├── allowed_datasets (jsonb)
├── restricted_fields (jsonb)

-- conversations
conversations
├── id
├── organization_id (FK)
├── user_id
├── goal_or_question
├── status            -- planning, analyzing, completed, failed
├── created_at

-- analysis_steps: langkah dalam analytical plan
analysis_steps
├── id
├── conversation_id (FK)
├── step_order
├── description
├── status
├── result_summary

-- tool_calls
tool_calls
├── id
├── analysis_step_id (FK)
├── tool_name
├── arguments (jsonb)
├── result (jsonb)
├── executed_sql (text, nullable)
├── status
├── created_at

-- insights
insights
├── id
├── conversation_id (FK)
├── finding
├── evidence
├── calculation
├── confidence
├── main_drivers (jsonb)
├── data_source

-- agent_memory: business instruction yang disimpan
agent_memory
├── id
├── organization_id (FK)
├── instruction_text
├── added_by
├── created_at
```

---

## 11. API Design (Ringkasan)

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/data-sources` | GET/POST | Kelola koneksi sumber data |
| `/semantic-layer/metrics` | GET/POST/PUT | Kelola definisi metrik & dimensi |
| `/conversations` | POST | Mulai percakapan/analisis baru (pertanyaan atau goal terbuka) → return `conversation_id`, status `planning` |
| `/conversations/{id}` | GET | Polling status & progres analisis |
| `/conversations/{id}/plan` | GET | Melihat analytical plan yang disusun agent |
| `/conversations/{id}/insights` | GET | Insight Card lengkap (finding, evidence, calculation, confidence) |
| `/conversations/{id}/audit` | GET | Audit trail lengkap (tool calls, SQL yang dieksekusi) |
| `/memory` | GET/POST/DELETE | Kelola business instruction (Agent Memory) |
| `/roles` | GET/POST/PUT | Kelola role & akses dataset/field |

**Pola respons async standar** (konsisten dengan Nexora):

```json
// POST /conversations
{
  "conversation_id": "conv_123",
  "status": "planning"
}
```

```json
// GET /conversations/conv_123
{
  "status": "analyzing",
  "current_step": "Break down revenue by region",
  "progress": 40
}
```

---

## 12. Keamanan & Governance

| Area | Kebijakan |
|---|---|
| **Akses data** | Role-based access control wajib sejak MVP — user hanya melihat dataset yang diizinkan role-nya. |
| **Field-level security** | Kolom sensitif (data pribadi, finansial detail) dapat ditandai restricted dan disaring otomatis dari query generation. |
| **Eksekusi query** | Read-only, row-limited, timeout dibatasi — agent tidak pernah menjalankan write/DDL terhadap data pelanggan. |
| **Credential sumber data** | Tidak disimpan sebagai plaintext; menggunakan secret manager / encrypted storage. |
| **Audit log** | Semua tahapan (pertanyaan → plan → tool call → SQL → insight) tercatat dan dapat ditelusuri admin. |
| **Transparansi tanpa membocorkan internal model** | Audit trail menampilkan tool call & SQL nyata, bukan chain-of-thought mentah dari LLM. |
| **Human accountability untuk fase Action (lanjut)** | Tindakan konsekuensial (purchase request, campaign trigger) selalu melalui human approval — tidak ada auto-execute. |

---

## 13. Evaluasi & Observability

### 13.1 Data yang Dicatat

- `conversations` — status & durasi tiap percakapan/analisis.
- `analysis_steps` & `tool_calls` — jejak eksekusi analytical plan.
- `insights` — finding, confidence, evidence per hasil.
- Token usage & waktu eksekusi per tahap (untuk cost control, sama seperti prinsip model routing di Nexora).

### 13.2 Metrik Evaluasi (Target Awal MVP)

| Metric | Target |
|---|---:|
| Intent understanding accuracy | > 90% |
| SQL correctness (tervalidasi terhadap semantic layer) | > 95% |
| Root cause relevance (dinilai reviewer manusia) | > 75% |
| Insight confidence rata-rata pada jawaban yang ditampilkan | terukur, dijadikan baseline |
| Rata-rata waktu penyelesaian analisis | terukur, dijadikan baseline |
| Query aman (tidak melanggar RBAC/field-level security) | 100% (hard requirement, bukan target toleransi) |

---

## 14. Roadmap Fase Pengembangan

| Fase | Fokus | Level (bagian 5) |
|---|---|---|
| Phase 0 | Product Design (dokumen ini) | — |
| Phase 1 | Fondasi aplikasi: Next.js dashboard + FastAPI backend + Supabase schema | — |
| Phase 2 | Koneksi data source (PostgreSQL/warehouse + CSV upload) | — |
| Phase 3 | Semantic Layer dasar: metrik, dimensi, business terminology mapping | — |
| Phase 4 | Ask Data: intent detection → SQL generation → eksekusi → jawaban naratif | Level 1–2 |
| Phase 5 | Autonomous Analysis Planner: goal terbuka → analytical plan → eksekusi bertahap | Level 2–3 |
| Phase 6 | Root Cause / Drill-down Engine | Level 3–4 |
| Phase 7 | Explainable Insight Card (finding, evidence, calculation, confidence) | Level 3–4 |
| Phase 8 | RBAC & field-level security | — (governance, prasyarat) |
| Phase 9 | Audit Trail lengkap | — (governance, prasyarat) |
| Phase 10 | Agent Memory dasar (business instruction) | — |
| Phase 11+ | **Fase 2 produk:** Forecasting & what-if, Business Recommendation Engine | Level 5–6 |
| Phase 12+ | **Fase 3 produk:** Proactive Monitoring, Action Agent (dengan human approval) | Level 7–8 |
| Phase 13+ | **Fase 4 produk:** Outcome Tracking, Multi-agent orchestration, Data Quality Agent, Multi-source data agent | Level 9 |

**Milestone keberhasilan MVP** dianggap tercapai jika alur berikut berjalan end-to-end terhadap minimal satu sumber data nyata:

> Business Question / Goal terbuka → Semantic Layer → Analytical Plan → SQL/Analysis Execution → Root Cause Breakdown → Explainable Insight, dengan RBAC & audit trail aktif penuh.

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Agent salah menafsirkan definisi metrik bisnis | Insight menyesatkan, keputusan bisnis salah | Semantic layer wajib sebagai satu-satunya sumber definisi; SQL generation tidak boleh bypass semantic layer |
| Query mengakses data di luar izin role | Pelanggaran governance/privasi | Row-level & field-level filtering otomatis sebelum hasil dikembalikan ke agent; target 100% (hard requirement) |
| Root cause yang ditampilkan bersifat korelasi, bukan kausalitas nyata | Rekomendasi bisnis keliru | Insight Card selalu menampilkan confidence & evidence, bukan klaim kepastian mutlak |
| Biaya LLM membengkak karena analytical plan panjang | Biaya operasional tidak terkendali | Model routing (cepat untuk intent/klasifikasi, kuat untuk plan/analisis kompleks), batas jumlah step per plan |
| Kepercayaan berlebihan terhadap output AI ("AI selalu benar") | Keputusan bisnis diambil tanpa verifikasi | Audit trail & explainability wajib ditampilkan, bukan opsional; insight selalu menyertakan confidence |
| Data quality buruk pada sumber data pelanggan | Insight tidak akurat tanpa disadari | MVP menyertakan quality check dasar saat data dihubungkan (missing values, freshness) sebelum dipakai dalam analisis |
| Scope creep ke Action Agent sebelum fondasi trust matang | Risiko tindakan otomatis yang salah | Action Agent sengaja ditunda ke fase lanjut, selalu dengan human approval — tidak ada exception |

---

## 16. Metrik Kesuksesan Produk (Portfolio-Level)

Selain metrik evaluasi teknis (bagian 13.2), keberhasilan produk sebagai portfolio diukur dari kemampuan mendemonstrasikan **tiga fitur pembeda** secara nyata:

1. **Autonomous Investigation** — agent benar-benar menyusun dan menjalankan analytical plan dari goal terbuka, bukan sekadar menjawab pertanyaan tunggal.
2. **Root Cause dengan drill-down otomatis** — bukan hanya "revenue turun 15%", tetapi breakdown kontributor yang terurut dan dapat diverifikasi.
3. **Governance sejak awal** — RBAC, field-level security, dan audit trail terlihat berfungsi, bukan sekadar disebut di dokumen.

Dari sini dapat diturunkan dokumentasi pendukung: README, diagram arsitektur, demo video (goal terbuka → plan → root cause → insight), artikel teknis tentang semantic layer, dan CV bullet points.

---

## 17. Lampiran — Ringkasan Prinsip Desain

1. **Positioning menentukan scope** — karena Datara diposisikan sebagai *autonomous analyst*, bukan *chatbot SQL*, MVP wajib mencakup Autonomous Analysis Planner dan Root Cause Engine, bukan hanya Ask Data.
2. **Semantic layer dulu, SQL generation kemudian** — agent tidak pernah menyusun query dari skema mentah tanpa melalui definisi bisnis yang disepakati.
3. **Governance bukan fitur v2** — RBAC, field-level security, dan audit trail dibangun bersamaan dengan core loop, karena itulah yang membuat enterprise berani mengadopsi.
4. **Explainability wajib, bukan opsional** — setiap insight membawa evidence, calculation, dan confidence sebagai bagian dari kontrak output, bukan tambahan UI.
5. **Action ditunda, insight didahulukan** — kemampuan menjalankan tindakan nyata (Level 8) hanya dibangun setelah kemampuan investigasi dan insight (Level 1–4) terbukti akurat dan dipercaya.
6. **Single agent, staged pipeline di MVP** — multi-agent orchestration adalah pengembangan lanjutan, bukan starting point, mengikuti prinsip yang sama dengan pendekatan di Nexora.
7. **Ukur, jangan klaim** — akurasi intent, korektnes SQL, dan relevansi root cause harus dibuktikan lewat metrik terukur, bukan opini kualitatif.

---

*Dokumen ini adalah PRD versi awal (MVP Definition) untuk Datara dan akan diperbarui seiring validasi teknis di setiap fase pengembangan.*
