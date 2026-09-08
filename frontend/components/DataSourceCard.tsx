"use client";

import React, { useState } from "react";
import { DataSource, DataSourceTestResult } from "@/lib/types";
import { testDataSourceConnection } from "@/lib/api";

interface DataSourceCardProps {
  dataSource: DataSource;
  onDelete?: (id: string) => void;
}

export const DataSourceCard: React.FC<DataSourceCardProps> = ({
  dataSource,
  onDelete,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<DataSourceTestResult | null>(null);

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "postgres":
      case "postgresql":
        return "bg-[#3B82F6] text-white"; // Blue
      case "supabase":
        return "bg-[#2DD4BF] text-black"; // Teal
      case "sqlite":
        return "bg-[#FFD12E] text-black"; // Yellow
      case "csv_upload":
        return "bg-[#FF5388] text-white"; // Pink
      case "mysql":
        return "bg-[#F97316] text-white"; // Orange
      default:
        return "bg-black text-white";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "postgres":
      case "postgresql":
        return "🐘";
      case "supabase":
        return "⚡";
      case "sqlite":
        return "🪶";
      case "csv_upload":
        return "📄";
      case "mysql":
        return "🐬";
      default:
        return "🗄️";
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testDataSourceConnection({
        type: dataSource.type,
        connection_meta: dataSource.connection_meta,
      });
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: "Failed to connect to endpoint",
      });
    } finally {
      setTesting(false);
    }
  };

  const meta = dataSource.connection_meta || {};

  return (
    <div className="bg-white border-3 border-black shadow-brutal p-5 rounded-none flex flex-col justify-between hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-lg transition-all">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-[#FAF6F0] border-2 border-black shadow-brutal-sm">
              {getTypeIcon(dataSource.type)}
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-black leading-tight">
                {dataSource.name}
              </h3>
              <p className="text-xs font-mono text-neutral-600">ID: {dataSource.id}</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border-2 border-black shadow-brutal-sm ${getBadgeColor(
              dataSource.type
            )}`}
          >
            {dataSource.type}
          </span>
        </div>

        {/* Card Meta Details */}
        <div className="bg-[#FAF6F0] border-2 border-black p-3 my-3 space-y-1.5 font-mono text-xs">
          {meta.database_url ? (
            <div className="truncate">
              <span className="text-neutral-500 font-semibold">URL:</span>{" "}
              <span className="font-bold text-black">{meta.database_url}</span>
            </div>
          ) : null}

          {meta.host ? (
            <div>
              <span className="text-neutral-500 font-semibold">Host:</span>{" "}
              <span className="font-bold text-black">
                {meta.host}:{meta.port || 5432}
              </span>
            </div>
          ) : null}

          {meta.database ? (
            <div>
              <span className="text-neutral-500 font-semibold">Database:</span>{" "}
              <span className="font-bold text-black">{meta.database}</span>
            </div>
          ) : null}

          {meta.file_name ? (
            <div>
              <span className="text-neutral-500 font-semibold">File:</span>{" "}
              <span className="font-bold text-black">{meta.file_name}</span>
            </div>
          ) : null}

          <div className="flex justify-between pt-1 border-t border-black/10">
            <span className="text-neutral-500 font-semibold">Indexed Tables:</span>
            <span className="font-bold text-black bg-[#FFD12E] px-1.5 border border-black">
              {meta.tables_count || 1} tables
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral-500 font-semibold">Sync Status:</span>
            <span className="font-bold text-[#2DD4BF] bg-black px-1.5">
              {meta.last_synced || "Active"}
            </span>
          </div>
        </div>

        {/* Test Result Toast/Badge */}
        {testResult && (
          <div
            className={`p-2.5 my-2 border-2 border-black text-xs font-mono font-bold ${
              testResult.success
                ? "bg-[#2DD4BF] text-black"
                : "bg-[#FF4757] text-white"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>{testResult.success ? "✓" : "✗"}</span>
              <span className="truncate">{testResult.message}</span>
            </div>
            {testResult.latency_ms && (
              <div className="text-[10px] mt-0.5 opacity-80">
                Ping Latency: {testResult.latency_ms}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t-2 border-black mt-2">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex-1 py-1.5 px-3 bg-[#FAF6F0] hover:bg-[#FFD12E] border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold font-mono transition-all disabled:opacity-50"
        >
          {testing ? "Testing..." : "⚡ Test Ping"}
        </button>

        {onDelete && (
          <button
            onClick={() => onDelete(dataSource.id)}
            className="py-1.5 px-3 bg-[#FAF6F0] hover:bg-[#FF4757] hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-xs font-bold font-mono transition-all"
            title="Disconnect Source"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
