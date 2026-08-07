import { joinUrl, post, postMultipartWithProgress, type UploadHandle } from "./client";
import type { DocumentType } from "@/features/riders/documentTypes";

export const API_GET_RIDER_DOCUMENTS_URL = joinUrl("/get-rider-documents");
export const API_UPLOAD_RIDER_DOCUMENT_URL = joinUrl("/upload-rider-document");
export const API_DELETE_RIDER_DOCUMENT_URL = joinUrl("/delete-rider-document");

export interface RiderDocument {
  id: string;
  type: DocumentType;
  name?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl: string;
}

export interface GetRiderDocumentsResponse {
  documents: RiderDocument[];
}

export interface UploadDocumentResponse {
  success: true;
  document: RiderDocument;
}

export interface DeleteDocumentResponse {
  success: true;
}

function isNotFoundEnvelope(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  try {
    const body: unknown = JSON.parse(err.message);
    if (!body || typeof body !== "object") return false;
    const b = body as Record<string, unknown>;
    return b.success === false;
  } catch {
    return false;
  }
}

export async function getRiderDocuments(phone: string, role: string): Promise<RiderDocument[] | null> {
  try {
    const res = await post<GetRiderDocumentsResponse>(API_GET_RIDER_DOCUMENTS_URL, { phone, role });
    return Array.isArray(res.documents) ? res.documents : [];
  } catch (err) {
    if (isNotFoundEnvelope(err)) return [];
    return null;
  }
}

export function uploadRiderDocument(
  phone: string,
  role: string,
  type: DocumentType,
  file: File,
  onProgress: (percent: number) => void,
  name?: string,
): UploadHandle<UploadDocumentResponse> {
  const form = new FormData();
  form.append("phone", phone);
  form.append("role", role);
  form.append("type", type);
  form.append("file", file, file.name);
  if (typeof name === "string" && name.length > 0) form.append("name", name);
  return postMultipartWithProgress<UploadDocumentResponse>(API_UPLOAD_RIDER_DOCUMENT_URL, form, onProgress);
}

export function deleteRiderDocument(phone: string, role: string, documentId: string): Promise<DeleteDocumentResponse> {
  return post<DeleteDocumentResponse>(API_DELETE_RIDER_DOCUMENT_URL, { phone, role, documentId });
}
