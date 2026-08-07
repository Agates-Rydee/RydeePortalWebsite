import { http, HttpResponse } from "msw";
import {
  API_DELETE_RIDER_DOCUMENT_URL,
  API_GET_RIDER_DOCUMENTS_URL,
  API_UPLOAD_RIDER_DOCUMENT_URL,
  type RiderDocument,
} from "@/api/riderDocuments";
import {
  DOCUMENT_TYPES,
  OTHER_NAME_MAX,
  normalizeOtherName,
  type DocumentType,
} from "@/features/riders/documentTypes";

const MAX_BYTES = 2 * 1024 * 1024;

function normalisePhone(v: string): string {
  return v.replace(/\D/g, "");
}

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function allowedMimesFor(type: DocumentType): string[] {
  return type === "profile_photo"
    ? ["image/jpeg", "image/png"]
    : ["application/pdf", "image/jpeg", "image/png"];
}

const documentsByPhone = new Map<string, RiderDocument[]>();

documentsByPhone.set("03127654321", [
  {
    id: "doc-seed-1",
    type: "cnic_front",
    filename: "cnic-front.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 348_212,
    uploadedAt: "2026-07-22T09:14:00.000Z",
    uploadedBy: "operator@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/cnic-front/800/500",
  },
  {
    id: "doc-seed-2",
    type: "bike_registration",
    filename: "bike-registration.pdf",
    mimeType: "application/pdf",
    sizeBytes: 812_004,
    uploadedAt: "2026-07-24T11:02:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/bike-reg/800/500",
  },
  {
    id: "doc-seed-3",
    type: "profile_photo",
    filename: "profile.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 210_500,
    uploadedAt: "2026-07-24T11:05:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/rider-profile/200/200",
  },
  {
    id: "doc-seed-3a",
    type: "other",
    name: "Tax certificate",
    filename: "tax-certificate.pdf",
    mimeType: "application/pdf",
    sizeBytes: 412_900,
    uploadedAt: "2026-07-25T08:10:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/tax-cert/800/500",
  },
  {
    id: "doc-seed-3b",
    type: "other",
    name: "Emergency contact",
    filename: "emergency-contact.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 122_300,
    uploadedAt: "2026-07-26T09:45:00.000Z",
    uploadedBy: "operator@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/emergency/800/500",
  },
]);

documentsByPhone.set("03007654321", [
  {
    id: "doc-seed-4",
    type: "driving_license",
    filename: "driving-license.pdf",
    mimeType: "application/pdf",
    sizeBytes: 512_768,
    uploadedAt: "2026-07-10T15:30:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/dl/800/500",
  },
  {
    id: "doc-seed-5",
    type: "cnic_back",
    filename: "cnic-back.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 298_140,
    uploadedAt: "2026-07-10T15:33:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/cnic-back/800/500",
  },
  {
    id: "doc-seed-5a",
    type: "other",
    name: "Reference letter",
    filename: "reference-letter.pdf",
    mimeType: "application/pdf",
    sizeBytes: 268_900,
    uploadedAt: "2026-07-11T09:20:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/reference/800/500",
  },
]);

documentsByPhone.set("03211234500", [
  {
    id: "doc-seed-6",
    type: "profile_photo",
    filename: "alia.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 184_320,
    uploadedAt: "2026-07-15T10:00:00.000Z",
    uploadedBy: "admin@rydee.pk",
    downloadUrl: "https://picsum.photos/seed/alia/200/200",
  },
]);

interface IdentifyBody {
  phone?: string;
  role?: string;
}

interface DeleteBody extends IdentifyBody {
  documentId?: string;
}

function isDocumentType(v: unknown): v is DocumentType {
  return typeof v === "string" && (DOCUMENT_TYPES as readonly string[]).includes(v);
}

export const riderDocumentsHandlers = [
  http.post(API_GET_RIDER_DOCUMENTS_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as IdentifyBody;
    const key = typeof body.phone === "string" ? normalisePhone(body.phone) : "";
    if (!key) {
      return HttpResponse.json({ success: false, error: "phone required" }, { status: 400 });
    }
    const docs = documentsByPhone.get(key) ?? [];
    return HttpResponse.json({ documents: docs });
  }),
  http.post(API_UPLOAD_RIDER_DOCUMENT_URL, async ({ request }) => {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return HttpResponse.json({ success: false, error: "invalid form data" }, { status: 400 });
    }
    const phone = form.get("phone");
    const type = form.get("type");
    const file = form.get("file");
    const rawName = form.get("name");
    if (typeof phone !== "string" || !(file instanceof File)) {
      return HttpResponse.json({ success: false, error: "phone and file required" }, { status: 400 });
    }
    if (!isDocumentType(type)) {
      return HttpResponse.json({ success: false, error: "Invalid document type" }, { status: 400 });
    }
    let otherName: string | undefined;
    if (type === "other") {
      const trimmed = typeof rawName === "string" ? rawName.trim() : "";
      if (!trimmed) {
        return HttpResponse.json({ success: false, error: "Name required for type=other" }, { status: 400 });
      }
      if (trimmed.length > OTHER_NAME_MAX) {
        return HttpResponse.json({ success: false, error: "Name too long" }, { status: 400 });
      }
      otherName = trimmed;
    }
    const key = normalisePhone(phone);
    if (file.size > MAX_BYTES) {
      return HttpResponse.json({ success: false, error: "File too large" }, { status: 413 });
    }
    const mime = file.type || mimeFromName(file.name);
    if (!allowedMimesFor(type).includes(mime)) {
      return HttpResponse.json({ success: false, error: "Unsupported file type" }, { status: 415 });
    }
    const doc: RiderDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      filename: file.name,
      mimeType: mime,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "admin@rydee.pk",
      downloadUrl: `https://picsum.photos/seed/${encodeURIComponent(type + "-" + file.name)}/800/500`,
    };
    if (type === "other" && otherName) doc.name = otherName;

    const list = documentsByPhone.get(key) ?? [];
    let next: RiderDocument[];
    if (type === "other") {
      const norm = normalizeOtherName(otherName ?? "");
      next = list.filter((d) => !(d.type === "other" && normalizeOtherName(d.name ?? "") === norm));
    } else {
      next = list.filter((d) => d.type !== type);
    }
    next.unshift(doc);
    documentsByPhone.set(key, next);
    return HttpResponse.json({ success: true, document: doc });
  }),
  http.post(API_DELETE_RIDER_DOCUMENT_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as DeleteBody;
    const key = typeof body.phone === "string" ? normalisePhone(body.phone) : "";
    const id = typeof body.documentId === "string" ? body.documentId : "";
    if (!key || !id) {
      return HttpResponse.json({ success: false, error: "phone and documentId required" }, { status: 400 });
    }
    const list = documentsByPhone.get(key) ?? [];
    const next = list.filter((d) => d.id !== id);
    if (next.length === list.length) {
      return HttpResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    documentsByPhone.set(key, next);
    return HttpResponse.json({ success: true });
  }),
];
