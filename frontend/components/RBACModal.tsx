"use client";

import React from "react";
import { X, ShieldCheck, EyeOff, Database } from "lucide-react";
import { Role } from "../lib/types";

interface RBACModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

export default function RBACModal({ isOpen, onClose, roles }: RBACModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-black shadow-brutal-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b-3 border-black flex items-center justify-between bg-[#2DD4BF]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black shadow-brutal-sm">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display text-base font-black uppercase tracking-wide text-black">
                RBAC & Field-Level Security
              </h3>
              <p className="text-2xs font-extrabold text-black/80">
                Governance enforced at AST query generation level
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white text-black hover:bg-slate-100 border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#FAF6F0]">
          <p className="text-xs font-bold text-slate-700 leading-relaxed bg-white p-3 rounded-xl border-2 border-black shadow-brutal-sm">
            🔒 Kolom-kolom sensitif disaring otomatis sebelum dieksekusi di database. Agent dilarang membentuk SQL yang menyentuh restricted fields.
          </p>

          <div className="space-y-3.5">
            {roles.map((role) => (
              <div
                key={role.id}
                className="rounded-2xl border-3 border-black p-4 bg-white shadow-brutal-sm space-y-2.5"
              >
                <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-black">{role.name}</span>
                    <span className="text-2xs bg-[#FFD12E] text-black font-mono px-2.5 py-0.5 rounded-md border border-black font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                      ROLE ACCESS
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <Database className="w-3.5 h-3.5 text-black" />
                      Allowed Datasets
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {role.allowed_datasets.map((ds, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#FAF6F0] text-black text-2xs font-mono font-bold border border-black"
                        >
                          {ds}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <EyeOff className="w-3.5 h-3.5 text-[#FF4757] stroke-[2.5]" />
                      Restricted Columns (Field-Level)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {role.restricted_fields.length > 0 ? (
                        role.restricted_fields.map((field, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-[#FF4757] text-white border border-black text-2xs font-mono font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                          >
                            🔒 {field}
                          </span>
                        ))
                      ) : (
                        <span className="text-2xs text-slate-500 font-mono font-bold">None (Full access)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t-3 border-black bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-[#FFD12E] border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
