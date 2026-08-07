export const DOCUMENT_TYPES = [
  "cnic_front",
  "cnic_back",
  "profile_photo",
  "bike_registration",
  "driving_license",
  "utility_bill",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const UPLOAD_SELECT_TYPES = [
  "cnic_front",
  "cnic_back",
  "bike_registration",
  "driving_license",
  "utility_bill",
  "other",
] as const;

export type UploadSelectType = (typeof UPLOAD_SELECT_TYPES)[number];

export const FIXED_REQUIRED_TYPES = [
  "cnic_front",
  "cnic_back",
  "bike_registration",
  "driving_license",
  "utility_bill",
] as const;

export type FixedRequiredType = (typeof FIXED_REQUIRED_TYPES)[number];

export const OTHER_NAME_MAX = 40;

export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

export const ACCEPT_GENERIC = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
export const ACCEPT_PROFILE_PHOTO = ".jpg,.jpeg,.png,image/jpeg,image/png";

const GENERIC_MIMES = ["application/pdf", "image/jpeg", "image/png"] as const;
const PROFILE_PHOTO_MIMES = ["image/jpeg", "image/png"] as const;

export function acceptAttrFor(type: DocumentType): string {
  return type === "profile_photo" ? ACCEPT_PROFILE_PHOTO : ACCEPT_GENERIC;
}

export function acceptedMimesFor(type: DocumentType): readonly string[] {
  return type === "profile_photo" ? PROFILE_PHOTO_MIMES : GENERIC_MIMES;
}

export function isMimeAcceptedFor(type: DocumentType, mime: string): boolean {
  return acceptedMimesFor(type).includes(mime as never);
}

export function normalizeOtherName(name: string): string {
  return name.trim().toLowerCase();
}
