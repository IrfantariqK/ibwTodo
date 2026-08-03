"use client";

import React, { useState, useEffect } from "react";
import { FileText, Folder, HardDrive, Download, FileImage, FileSpreadsheet, File } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { TaskAttachment } from "@/types";

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return <FileImage className="w-4 h-4 text-sky-500" />;
  if (type === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (type?.includes("word")) return <FileText className="w-4 h-4 text-blue-600" />;
  if (type?.includes("excel") || type?.includes("spreadsheet") || type === "text/csv")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  return <File className="w-4 h-4 text-slate-500" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const FilesView: React.FC = () => {
  const { activeProject } = useProject();
  const [attachments, setAttachments] = useState<{ file: TaskAttachment; taskTitle: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTaskFiles() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const tasks = await res.json();
          const pId = activeProject ? activeProject.id || activeProject._id : null;

          const filteredTasks = pId
            ? tasks.filter((t: any) => t.projectId === pId)
            : tasks;

          const collected: { file: TaskAttachment; taskTitle: string }[] = [];
          filteredTasks.forEach((t: any) => {
            if (t.attachments && Array.isArray(t.attachments)) {
              t.attachments.forEach((att: TaskAttachment) => {
                collected.push({ file: att, taskTitle: t.title });
              });
            }
          });
          setAttachments(collected);
        }
      } catch (err) {
        console.warn("Error fetching task files:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTaskFiles();
  }, [activeProject]);

  const totalBytes = attachments.reduce((acc, curr) => acc + (curr.file.size || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">
              {activeProject ? `Project: ${activeProject.name}` : "All Project Files"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#006858]" />
            Workspace File Storage
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Shared cloud attachments, client screenshots & project documents stored in MongoDB Atlas.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Project Storage Used</span>
            <HardDrive className="w-4 h-4 text-[#006858]" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{formatBytes(totalBytes)}</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#006858] h-full w-1/4 rounded-full" />
          </div>
        </div>

        <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Uploaded Files</span>
            <Folder className="w-4 h-4 text-[#006858]" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{attachments.length} Files</p>
          <p className="text-xs text-slate-400 font-medium">
            {activeProject ? `Attached to ${activeProject.name}` : "All projects"}
          </p>
        </div>

        <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cloud Database</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              MongoDB Atlas
            </span>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">Base64 Vault</p>
          <p className="text-xs text-slate-400 font-medium">Encrypted document storage</p>
        </div>
      </div>

      {/* Files Table */}
      <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base">Project Task Files & Attachments</h3>

        {attachments.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-bold space-y-1">
            <p>No files uploaded for this project yet.</p>
            <p className="text-[10px] text-slate-400 font-normal">
              Upload screenshots or documents when creating tasks to see them here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((item, idx) => {
              const file = item.file;
              return (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#0F172A]">{file.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatBytes(file.size)} • Task: <span className="text-[#006858] font-bold">{item.taskTitle}</span>
                      </p>
                      {file.comment && (
                        <p className="text-[10px] text-slate-600 font-medium italic mt-0.5">
                          "{file.comment}"
                        </p>
                      )}
                    </div>
                  </div>

                  {file.data && (
                    <a
                      href={file.data}
                      download={file.name}
                      className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-[#006858] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
