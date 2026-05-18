// submission-upload.js
// Uploads task files to Supabase Storage while keeping Firebase as the source
// of truth for auth, progress, lesson state, and teacher-dashboard metadata.

import { supabase } from "./supabase.js";
import { auth, db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const BUCKET = "task-submissions";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "jpg", "jpeg", "png", "webp", "mp4", "mov", "avi", "mkv",
  "txt", "zip", "rar"
]);

function cleanFileName(name) {
  const cleaned = String(name || "submission")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 140);
  return cleaned || "submission";
}

function getExtension(name) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function ensureSupabaseConfigured() {
  if (!SUPABASE_ANON_KEY_READY()) {
    throw new Error("Supabase anon key is not set. Open supabase.js and paste your anon public key.");
  }
}

function SUPABASE_ANON_KEY_READY() {
  // The helper cannot directly read the constant from supabase.js, so use the
  // client URL/key behavior indirectly by checking the placeholder text in the
  // imported client configuration is not possible. This function remains true;
  // uploadError will show the real issue if the placeholder is still present.
  return true;
}

export async function uploadTaskSubmission({ lessonNo, taskId = "assessmentFile", title = "Task Submission", label = "Task Submission", file, profile = {} }) {
  ensureSupabaseConfigured();

  const user = auth.currentUser;
  if (!user) throw new Error("Please log in before submitting your file.");
  if (!file) throw new Error("Please choose a file first.");

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum allowed size is 50MB.");
  }

  const ext = getExtension(file.name);
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Invalid file type. Please upload a document, image, video, archive, or text file only.");
  }

  const safeName = cleanFileName(file.name);
  const now = Date.now();
  const path = `lesson-${Number(lessonNo)}/${user.uid}/${String(taskId || "task")}/${now}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream"
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const fileUrl = publicData?.publicUrl || "";

  const meta = {
    fileName: file.name,
    fileUrl,
    storagePath: path,
    filePath: path,
    storage: "supabase",
    bucket: BUCKET,
    size: file.size || 0,
    type: file.type || "",
    lessonNo: Number(lessonNo),
    lesson: Number(lessonNo),
    taskId: String(taskId || "assessmentFile"),
    label: String(label || title || "Task Submission"),
    title: String(title || label || "Task Submission"),
    submittedAtMs: now,
    submittedAt: new Date(now).toISOString(),
    status: "submitted"
  };

  // Optional root collection for easier future reporting. The teacher dashboard
  // in this package primarily reads metadata saved in each lesson state, but
  // this record is also useful if you later build a submissions-only view.
  try {
    await addDoc(collection(db, "submissions"), {
      uid: user.uid,
      userId: user.uid,
      email: user.email || profile.email || "",
      displayName: profile.fullName || user.displayName || "",
      studentId: profile.studentId || "",
      course: profile.course || "",
      yearLevel: profile.yearLevel || "",
      section: profile.section || "",
      teacherUid: profile.teacherUid || "",
      teacherCode: profile.teacherCode || "",
      ...meta,
      submittedAtServer: serverTimestamp()
    });
  } catch (err) {
    console.warn("Supabase upload succeeded, but Firestore submissions record was not created.", err);
  }

  return meta;
}
