"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { DataSourceCard } from "@/components/DataSourceCard";
import { DataSource, DataSourceType } from "@/lib/types";
import {
  fetchDataSources,
  createDataSource,
  deleteDataSource,
  testDataSourceConnection,
} from "@/lib/api";

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Connect New Source
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<DataSourceType>("postgres");
  const [formHost, setFormHost] = useState("db.internal.corp");
  const [formPort, setFormPort] = useState("5432");
  const [formDb, setFormDb] = useState("analytics_production");
  const [formUser, setFormUser] = useState("readonly_analyst");
  const [formPassword, setFormPassword] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formTestStatus, setFormTestStatus] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDataSources();
      setDataSources(data);
    } catch {
      // Handled in api.ts fallback
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this data source?")) return;
    await deleteDataSource(id);
    setDataSources((prev) => prev.filter((d) => d.id !== id));
  };

  const handleTestModalConnection = async () => {
    setIsTesting(true);
    setFormTestStatus(null);
    try {
      const meta: Record<string, any> = {};
      if (formType === "sqlite" || formType === "supabase") {
        meta.database_url = formUrl || (formType === "sqlite" ? "sqlite:///./datara_demo.db" : "https://mdxboqkoixrgywmmyqxs.supabase.co");
      } else {
        meta.host = formHost;
        meta.port = parseInt(formPort) || 5432;
        meta.database = formDb;
        meta.username = formUser;
        meta.password = formPassword;
      }

      const res = await testDataSourceConnection({
        type: formType,
        connection_meta: meta,
      });
      setFormTestStatus(res);
    } catch {
      setFormTestStatus({ success: false, message: "Connection test failed." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const meta: Record<string, any> = {};
      if (formType === "sqlite" || formType === "supabase") {
        meta.database_url = formUrl;
      } else if (formType === "csv_upload") {
        meta.file_name = formName.toLowerCase().replace(/\s+/g, "_") + ".csv";
        meta.file_path = "/data/uploads/" + meta.file_name;
      } else {
        meta.host = formHost;
        meta.port = parseInt(formPort) || 5432;
        meta.database = formDb;
        meta.username = formUser;
        meta.password = formPassword;
      }

      const newDs = await createDataSource({
        name: formName,
        type: formType,
        connection_meta: meta,
      });

      setDataSources((prev) => [newDs, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormType("postgres");
    setFormUrl("");
    setFormPassword("");
    setFormTestStatus(null);
  };

  const filteredSources = dataSources.filter((ds) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "sql")
      return ["postgres", "postgresql", "mysql", "sqlite"].includes(ds.type);
    if (activeFilter === "cloud") return ["supabase", "bigquery", "snowflake"].includes(ds.type);
    if (activeFilter === "files") return ["csv_upload"].includes(ds.type);
    return true;
  });

  const totalTables = dataSources.reduce(
    (acc, curr) => acc + (curr.connection_meta?.tables_count || 1),
    0
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col font-sans">
      {/* Top Navigation */}
      <TopNav activeTab="datasources" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-black pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-600 mb-1">
              <Link href="/" className="hover:underline">
                WORKSTATION
              </Link>
              <span>/</span>
              <span className="bg-[#FFD12E] text-black px-1.5 border border-black">
                DATA SOURCES
              </span>
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-black tracking-tight">
              Enterprise Data Sources
            </h1>
            <p className="text-sm font-mono text-neutral-700 mt-1 max-w-2xl">
              Connect external databases, cloud data warehouses, or file repositories. Datara analyzes your data via read-only AST-sanitized sandboxes.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-neobrutal bg-[#FFD12E] hover:bg-[#FFE066] text-black font-display font-bold text-sm px-5 py-3 rounded-none flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <span className="text-lg leading-none">+</span>
            Connect New Source
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-3 border-black shadow-brutal p-4">
            <span className="text-xs font-mono font-bold uppercase text-neutral-600 block">
              Connected Sources
            </span>
            <span className="font-display font-black text-3xl text-black">
              {dataSources.length}
            </span>
          </div>

          <div className="bg-[#2DD4BF] border-3 border-black shadow-brutal p-4 text-black">
            <span className="text-xs font-mono font-bold uppercase block opacity-90">
              Indexed Tables
            </span>
            <span className="font-display font-black text-3xl">{totalTables}</span>
          </div>

          <div className="bg-[#FF5388] border-3 border-black shadow-brutal p-4 text-white">
            <span className="text-xs font-mono font-bold uppercase block opacity-90">
              Sandbox Security
            </span>
            <span className="font-display font-black text-xl md:text-2xl mt-1 block">
              100% Read-Only
            </span>
          </div>

          <div className="bg-[#3B82F6] border-3 border-black shadow-brutal p-4 text-white">
            <span className="text-xs font-mono font-bold uppercase block opacity-90">
              Supabase Status
            </span>
            <span className="font-display font-bold text-sm md:text-base mt-1 block flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF] animate-ping" />
              Build APIs Ready
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-black pb-2">
          {[
            { id: "all", label: "All Sources" },
            { id: "sql", label: "SQL Databases (Postgres / MySQL / SQLite)" },
            { id: "cloud", label: "Cloud DB (Supabase / Warehouse)" },
            { id: "files", label: "Files & CSV" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold border-2 border-black shadow-brutal-sm transition-all ${
                activeFilter === tab.id
                  ? "bg-black text-white translate-x-0.5 translate-y-0.5 shadow-none"
                  : "bg-white hover:bg-[#FAF6F0] text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Data Source Cards Grid */}
        {loading ? (
          <div className="p-12 text-center font-mono font-bold text-neutral-600 bg-white border-3 border-black shadow-brutal">
            Loading data sources...
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="p-12 text-center bg-white border-3 border-black shadow-brutal space-y-3">
            <p className="font-display font-bold text-lg">No data sources found in this category.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#FFD12E] border-2 border-black font-mono font-bold text-xs shadow-brutal-sm hover:bg-[#FFE066]"
            >
              Add First Source
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSources.map((ds) => (
              <DataSourceCard key={ds.id} dataSource={ds} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Connect New Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-3 border-black shadow-brutal-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-3 border-black pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-[#FFD12E] border-2 border-black text-sm">🔌</span>
                <h2 className="font-display font-extrabold text-xl text-black">
                  Connect Data Source
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-8 h-8 flex items-center justify-center bg-[#FAF6F0] hover:bg-[#FF4757] hover:text-white border-2 border-black font-mono font-bold text-sm shadow-brutal-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSource} className="space-y-4">
              {/* Connector Type Selector */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5">
                  Source Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "postgres", label: "PostgreSQL", icon: "🐘" },
                    { id: "supabase", label: "Supabase API", icon: "⚡" },
                    { id: "mysql", label: "MySQL", icon: "🐬" },
                    { id: "sqlite", label: "SQLite DB", icon: "🪶" },
                    { id: "csv_upload", label: "CSV File", icon: "📄" },
                  ].map((typeOption) => (
                    <button
                      type="button"
                      key={typeOption.id}
                      onClick={() => setFormType(typeOption.id as DataSourceType)}
                      className={`p-2.5 text-xs font-mono font-bold border-2 border-black flex items-center gap-2 transition-all ${
                        formType === typeOption.id
                          ? "bg-[#FFD12E] shadow-brutal-sm translate-x-0.5 translate-y-0.5"
                          : "bg-white hover:bg-[#FAF6F0]"
                      }`}
                    >
                      <span>{typeOption.icon}</span>
                      <span className="truncate">{typeOption.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Name */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1">
                  Connection Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Production DW"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#FAF6F0] border-2 border-black p-2.5 text-sm font-mono focus:bg-white focus:outline-none"
                />
              </div>

              {/* Type Specific Fields */}
              {formType === "supabase" ? (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">
                    Supabase Project REST URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-project.supabase.co"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full bg-[#FAF6F0] border-2 border-black p-2.5 text-sm font-mono focus:bg-white focus:outline-none"
                  />
                  <p className="text-[11px] font-mono text-neutral-600 mt-1">
                    Datara uses official Supabase Build APIs. Secret Key is stored securely in backend .env.
                  </p>
                </div>
              ) : formType === "sqlite" ? (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">
                    SQLite Database URI or Path
                  </label>
                  <input
                    type="text"
                    placeholder="sqlite:///./datara_demo.db"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full bg-[#FAF6F0] border-2 border-black p-2.5 text-sm font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              ) : formType === "csv_upload" ? (
                <div>
                  <label className="block text-xs font-mono font-bold uppercase mb-1">
                    CSV File Path / Upload
                  </label>
                  <div className="p-4 border-2 border-dashed border-black bg-[#FAF6F0] text-center font-mono text-xs">
                    Drop CSV files here or specify server path.
                  </div>
                </div>
              ) : (
                /* Standard SQL (PostgreSQL, MySQL) */
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono font-bold uppercase mb-1">
                        Host
                      </label>
                      <input
                        type="text"
                        value={formHost}
                        onChange={(e) => setFormHost(e.target.value)}
                        className="w-full bg-[#FAF6F0] border-2 border-black p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase mb-1">
                        Port
                      </label>
                      <input
                        type="text"
                        value={formPort}
                        onChange={(e) => setFormPort(e.target.value)}
                        className="w-full bg-[#FAF6F0] border-2 border-black p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase mb-1">
                        Database
                      </label>
                      <input
                        type="text"
                        value={formDb}
                        onChange={(e) => setFormDb(e.target.value)}
                        className="w-full bg-[#FAF6F0] border-2 border-black p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formUser}
                        onChange={(e) => setFormUser(e.target.value)}
                        className="w-full bg-[#FAF6F0] border-2 border-black p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-[#FAF6F0] border-2 border-black p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Test Status Banner */}
              {formTestStatus && (
                <div
                  className={`p-3 border-2 border-black font-mono text-xs font-bold ${
                    formTestStatus.success
                      ? "bg-[#2DD4BF] text-black"
                      : "bg-[#FF4757] text-white"
                  }`}
                >
                  <div>{formTestStatus.success ? "✓ Test Passed:" : "✗ Test Failed:"}</div>
                  <div className="text-[11px] font-normal mt-0.5">
                    {formTestStatus.message}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={handleTestModalConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-[#FAF6F0] hover:bg-[#FFD12E] border-2 border-black text-xs font-mono font-bold shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  {isTesting ? "Testing Connection..." : "⚡ Live Ping Test"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-white hover:bg-neutral-200 border-2 border-black text-xs font-mono font-bold shadow-brutal-sm"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white border-2 border-black text-xs font-mono font-bold shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
                  >
                    {isSubmitting ? "Saving..." : "Save Connection"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
