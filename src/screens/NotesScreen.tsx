import { For, Show, createSignal } from "solid-js";
import type { RoutePath } from "../types";
import type { AppData } from "../data/types";
import { Button, Card, IconBadge } from "../components/ui";
import { createMutation } from "../convex";
import { api } from "../data/live";
import type { Id } from "../../convex/_generated/dataModel";

type NotesData = AppData["notes"];

function fileType(file: File): "pdf" | "doc" | "slides" | "image" | "text" {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (extension === "ppt" || extension === "pptx") return "slides";
  if (file.type.startsWith("image/")) return "image";
  if (extension === "txt") return "text";
  return "doc";
}

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function timeLabel(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(timestamp);
}

export function NotesScreen(props: { navigate: (path: RoutePath) => void; data: NotesData; study: AppData["study"] }) {
  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);
  const [subject, setSubject] = createSignal(props.study?.subject ?? props.data.items[0]?.subject ?? "");
  const [grade, setGrade] = createSignal(props.study?.grade ?? props.data.items[0]?.grade ?? "");
  const [title, setTitle] = createSignal("");
  const [topic, setTopic] = createSignal("");
  const [tags, setTags] = createSignal("");
  const [uploading, setUploading] = createSignal(false);
  const [uploadError, setUploadError] = createSignal("");
  const generateUploadUrl = createMutation(api.notes.generateUploadUrl);
  const createNote = createMutation(api.notes.create);
  let fileInput!: HTMLInputElement;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles((current) => [...current, ...Array.from(files)].slice(0, 5));
  };

  const analyze = async () => {
    if (selectedFiles().length === 0) { fileInput.click(); return; }
    setUploading(true);
    setUploadError("");
    try {
      for (const file of selectedFiles()) {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!response.ok) throw new Error(`Could not upload ${file.name}`);
        const { storageId } = await response.json() as { storageId: Id<"_storage"> };
        await createNote({ title: title() || file.name.replace(/\.[^.]+$/, ""), fileName: file.name, subject: subject() || "General", grade: grade() || "Unspecified", topic: topic() || undefined, tags: tags().split(",").map((tag) => tag.trim()).filter(Boolean), storageId, fileType: fileType(file), sizeLabel: sizeLabel(file.size) });
      }
      setSelectedFiles([]);
      props.navigate("/study");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div class="page-stack">
      <header class="page-header"><div><p class="eyebrow">Knowledge base</p><h1>Upload your notes</h1><p>Turn PDFs, documents, and class slides into explanations, quizzes, and a focused revision plan.</p></div><Button variant="secondary">How it works?</Button></header>
      <div class="content-with-rail">
        <div class="main-column">
          <Card>
            <div class={`drop-zone ${isDragging() ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer?.files ?? null); }}>
              <IconBadge icon="↑" size="lg" /><h2>Drag & drop your files here</h2><p>or choose files from your device</p><Button onClick={() => fileInput.click()}>＋ Choose files</Button><small>PDF, DOCX, PPTX, TXT, PNG or JPG · up to 50 MB each</small>
              <input ref={fileInput} type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" onChange={(event) => addFiles(event.currentTarget.files)} />
            </div>
            <Show when={selectedFiles().length > 0}><div class="selected-files"><For each={selectedFiles()}>{(file, index) => <div><IconBadge icon="▤" tone="green" size="sm" /><span><strong>{file.name}</strong><small>{sizeLabel(file.size)}</small></span><button onClick={() => setSelectedFiles((files) => files.filter((_, itemIndex) => itemIndex !== index()))} aria-label={`Remove ${file.name}`}>×</button></div>}</For></div></Show>
          </Card>
          <Card>
            <div class="section-heading compact"><div><h2>Note details</h2><p>A little context helps Quizzly organize and explain your material.</p></div></div>
            <div class="form-grid">
              <label><span>Title</span><input value={title()} onInput={(event) => setTitle(event.currentTarget.value)} placeholder="e.g. Photosynthesis notes" /></label>
              <label><span>Subject</span><input value={subject()} onInput={(event) => setSubject(event.currentTarget.value)} placeholder="e.g. Biology" /></label>
              <label><span>Class / grade</span><input value={grade()} onInput={(event) => setGrade(event.currentTarget.value)} placeholder="e.g. Class 11" /></label>
              <label><span>Topic</span><input value={topic()} onInput={(event) => setTopic(event.currentTarget.value)} placeholder="e.g. Light-dependent reactions" /></label>
              <label class="full-span"><span>Tags</span><input value={tags()} onInput={(event) => setTags(event.currentTarget.value)} placeholder="biology, chapter-6, important" /></label>
            </div>
            <Show when={uploadError()}><p class="upload-error">{uploadError()}</p></Show>
            <div class="form-callout"><span>✦</span><p>Quizzly will extract key ideas and generate an explanation, quiz, and revision plan.</p><Button disabled={uploading()} onClick={() => void analyze()}>{uploading() ? "Uploading…" : selectedFiles().length ? "Upload & analyze" : "Choose files"}</Button></div>
          </Card>
        </div>
        <aside class="right-rail">
          <Card><div class="section-heading compact"><div><h2>What happens next?</h2><p>Your notes become an active learning kit.</p></div></div><ol class="steps-list"><For each={props.data.workflow}>{(step) => <li><span>{step.icon}</span><p><strong>{step.title}</strong><br />{step.detail}</p></li>}</For></ol></Card>
          <Card><div class="section-heading compact"><div><h2>Recent uploads</h2><p>{props.data.items.length} items</p></div><button class="text-button">View all</button></div><div class="upload-list"><For each={props.data.items}>{(item) => <button onClick={() => props.navigate("/study")}><IconBadge icon={item.fileType === "slides" ? "P" : item.fileType === "doc" ? "W" : "▤"} tone={item.fileType === "doc" ? "blue" : item.fileType === "slides" ? "amber" : "rose"} /><span><strong>{item.fileName}</strong><small>{item.subject} · {item.grade}</small><small>{timeLabel(item.uploadedAt)} · {item.sizeLabel}</small></span><b>{item.status === "complete" ? "✓" : `${item.progress}%`}</b></button>}</For></div></Card>
        </aside>
      </div>
    </div>
  );
}
