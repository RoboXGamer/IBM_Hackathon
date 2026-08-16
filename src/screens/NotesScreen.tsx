import { For, Show, createMemo, createSignal } from "solid-js";
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
  const [success, setSuccess] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [showGuide, setShowGuide] = createSignal(true);
  const [openingId, setOpeningId] = createSignal<string>();
  const generateUploadUrl = createMutation(api.notes.generateUploadUrl);
  const createNote = createMutation(api.notes.create);
  const activateNote = createMutation(api.notes.activate);
  const removeNote = createMutation(api.notes.remove);
  let fileInput!: HTMLInputElement;
  const filteredNotes = createMemo(() => {
    const query = search().trim().toLowerCase();
    return query ? props.data.items.filter((item) => `${item.title} ${item.subject} ${item.topic ?? ""}`.toLowerCase().includes(query)) : props.data.items;
  });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const oversized = incoming.find((file) => file.size > 50 * 1024 * 1024);
    if (oversized) { setUploadError(`${oversized.name} is larger than the 50 MB limit.`); return; }
    setUploadError("");
    setSelectedFiles((current) => [...current, ...incoming.filter((file) => !current.some((item) => item.name === file.name && item.size === file.size))].slice(0, 5));
  };

  const analyze = async () => {
    if (selectedFiles().length === 0) { fileInput.click(); return; }
    setUploading(true);
    setUploadError("");
    setSuccess("");
    try {
      for (const file of selectedFiles()) {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!response.ok) throw new Error(`Could not upload ${file.name}`);
        const { storageId } = await response.json() as { storageId: Id<"_storage"> };
        await createNote({ title: title() || file.name.replace(/\.[^.]+$/, ""), fileName: file.name, subject: subject() || "General", grade: grade() || "Unspecified", topic: topic() || undefined, tags: tags().split(",").map((tag) => tag.trim()).filter(Boolean), storageId, fileType: fileType(file), sizeLabel: sizeLabel(file.size) });
      }
      setSelectedFiles([]);
      setTitle(""); setTopic(""); setTags("");
      setSuccess("Upload complete. Your note is safely stored and ready for the document-processing pipeline.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openNote = async (note: NotesData["items"][number]) => {
    if (!note.studyReady) { setUploadError("This note is stored, but its study kit is not ready yet."); return; }
    setOpeningId(String(note._id)); setUploadError("");
    try { await activateNote({ noteId: note._id }); props.navigate("/study"); }
    catch (reason) { setUploadError(reason instanceof Error ? reason.message : "Could not open this note"); }
    finally { setOpeningId(undefined); }
  };

  const deleteNote = async (note: NotesData["items"][number]) => {
    if (!window.confirm(`Remove ${note.fileName}? This cannot be undone.`)) return;
    try { await removeNote({ noteId: note._id }); }
    catch (reason) { setUploadError(reason instanceof Error ? reason.message : "Could not remove this note"); }
  };

  return (
    <div class="page-stack">
      <header class="page-header"><div><p class="eyebrow">Knowledge base</p><h1>Your notes, organized for action</h1><p>Upload material, track its processing state, and open only the study kits that are ready.</p></div><Button variant="secondary" onClick={() => setShowGuide(!showGuide())}>{showGuide() ? "Hide guide" : "How it works"}</Button></header>
      <Show when={success()}><div class="inline-notice success"><span>✓</span><p>{success()}</p></div></Show>
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
          <Show when={showGuide()}><Card><div class="section-heading compact"><div><h2>What happens next?</h2><p>A transparent path from file to practice</p></div></div><ol class="steps-list"><For each={props.data.workflow}>{(step) => <li><span>{step.icon}</span><p><strong>{step.title}</strong><br />{step.detail}</p></li>}</For></ol></Card></Show>
          <Card><div class="section-heading compact"><div><h2>Note library</h2><p>{filteredNotes().length} of {props.data.items.length} notes</p></div></div><label class="library-search"><span>⌕</span><input value={search()} onInput={(event) => setSearch(event.currentTarget.value)} placeholder="Search by title, subject, or topic" /></label><div class="upload-list actionable"><For each={filteredNotes()}>{(item) => <article><IconBadge icon={item.fileType === "slides" ? "P" : item.fileType === "doc" ? "W" : "▤"} tone={item.fileType === "doc" ? "blue" : item.fileType === "slides" ? "amber" : "rose"} /><span><strong>{item.fileName}</strong><small>{item.subject} · {item.grade}</small><small>{timeLabel(item.uploadedAt)} · {item.sizeLabel}</small></span><div class="note-row-actions"><span class={`status-pill ${item.studyReady ? "status-success" : "status-warning"}`}>{item.studyReady ? "Study kit ready" : item.status}</span><button class="text-button" disabled={!item.studyReady || openingId() === String(item._id)} onClick={() => void openNote(item)}>{openingId() === String(item._id) ? "Opening…" : "Open"}</button><button class="icon-danger" onClick={() => void deleteNote(item)} aria-label={`Delete ${item.fileName}`}>×</button></div></article>}</For><Show when={filteredNotes().length === 0}><div class="small-empty"><strong>No matching notes</strong><p>Try a different search or upload new material.</p></div></Show></div></Card>
        </aside>
      </div>
    </div>
  );
}
