"use client";

import React, { useState, useEffect } from "react";
import { FileText, Folder, HardDrive, Download, FileImage, FileSpreadsheet, File, FolderKanban } from "lucide-react";
import { useProject } from "@/context/ProjectContext";
import { TaskAttachment, ProjectFile } from "@/types";

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return <FileImage className="w-4 h-4 text-sky-500" />;
  if (type === "application/pdf" || type?.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
  if (type?.includes("word") || type?.includes("document")) return <FileText className="w-4 h-4 text-blue-600" />;
  if (type?.includes("excel") || type?.includes("spreadsheet") || type === "text/csv")
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  return <File className="w-4 h-4 text-[#006858]" />;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CombinedFileItem {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  url?: string;
  data?: string;
  source: "Project File" | "Task Attachment";
  projectName: string;
  taskTitle?: string;
  uploadedAt?: string;
}

export const FilesView: React.FC = () => {
  const { projects, activeProject } = useProject();
  const [fileList, setFileList] = useState<CombinedFileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        const collected: CombinedFileItem[] = [];

        // 1. Collect Project Files from MongoDB Projects
        const activePId = activeProject ? activeProject.id || activeProject._id : null;
        const targetProjects = activePId
          ? projects.filter((p) => (p.id === activePId || p._id === activePId))
          : projects;

        targetProjects.forEach((p) => {
          if (p.files && Array.isArray(p.files)) {
            p.files.forEach((f: ProjectFile) => {
              collected.push({
                id: f.id || `pf-${Math.random()}`,
                name: f.name,
                size: f.size || "0 KB",
                sizeBytes: 1024 * 50,
                type: f.type || "Document",
                url: f.url || f.data,
                data: f.data || f.url,
                source: "Project File",
                projectName: p.name,
                uploadedAt: f.uploadedAt,
              });
            });
          }
        });

        // 2. Collect Task Files from MongoDB Tasks
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const tasks = await res.json();
          const filteredTasks = activePId
            ? tasks.filter((t: any) => t.projectId === activePId)
            : tasks;

          filteredTasks.forEach((t: any) => {
            if (t.attachments && Array.isArray(t.attachments)) {
              const matchedProject = projects.find((p) => (p.id === t.projectId || p._id === t.projectId));
              t.attachments.forEach((att: TaskAttachment) => {
                collected.push({
                  id: att.id || `tf-${Math.random()}`,
                  name: att.name,
                  size: formatBytes(att.size || 0),
                  sizeBytes: att.size || 0,
                  type: att.type || "Attachment",
                  url: att.data,
                  data: att.data,
                  source: "Task Attachment",
                  projectName: matchedProject ? matchedProject.name : "Workspace Task",
                  taskTitle: t.title,
                  uploadedAt: att.uploadedAt,
                });
              });
            }
          });
        }

        setFileList(collected);
      } catch (err) {
        console.warn("Error loading file storage:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [activeProject, projects]);

  const totalSizeBytes = fileList.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#006858] uppercase tracking-wider">
              {activeProject ? `Project: ${activeProject.name}` : "Workspace Storage"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#006858]" />
            Workspace File Storage
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Project specification documents, task attachments, and wireframes saved in MongoDB Atlas.
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
          <p className="text-2xl font-black text-[#0F172A]">{formatBytes(totalSizeBytes)}</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#006858] h-full w-1/3 rounded-full" />
          </div>
        </div>

        <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Project Files</span>
            <Folder className="w-4 h-4 text-[#006858]" />
          </div>
          <p className="text-2xl font-black text-[#0F172A]">{fileList.length} Files</p>
          <p className="text-xs text-slate-400 font-medium">
            {activeProject ? `Associated with ${activeProject.name}` : "Across all active projects"}
          </p>
        </div>

        <div className="modern-card rounded-3xl p-5 bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Cloud Vault</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              MongoDB Atlas
            </span>
          </div>
          <p className="text-2xl font-black text-[#0F172A]">Encrypted Store</p>
          <p className="text-xs text-slate-400 font-medium">Persistent file storage</p>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="modern-card rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-base text-[#0F172A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#006858]" />
            Project Files
          </h3>
          <span className="text-xs font-bold text-[#006858] bg-emerald-50 px-3 py-1 rounded-full">
            {fileList.length} Total Files
          </span>
        </div>

        {fileList.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-bold space-y-1">
            <p>No project files found in MongoDB Database.</p>
            <p className="text-[10px] text-slate-400 font-normal">
              Attach files when creating a project or creating tasks to see them here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fileList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-colors border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {getFileIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#0F172A]">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {item.size} • Project: <span className="text-[#006858] font-bold">{item.projectName}</span>
                      {item.taskTitle && (
                        <span> · Task: <strong className="text-slate-700">{item.taskTitle}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100/70 text-[#006858]">
                    {item.source}
                  </span>

                  {(item.url || item.data) && (
                    <a
                      href={item.url || item.data}
                      download={item.name}
                      className="p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-[#006858] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
