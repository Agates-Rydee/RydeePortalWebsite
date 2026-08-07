import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Camera, Copy, Download, Eye, FileUp, Info, KeyRound, Loader2, Lock, ShieldOff, Trash2, X } from "lucide-react";
import { activateRider, getAllRiders, resetRiderPin, updateUser } from "@/api/riders";
import type { RiderStatus } from "@/types/rider";
import {
  deleteRiderDocument,
  getRiderDocuments,
  uploadRiderDocument,
  type RiderDocument,
} from "@/api/riderDocuments";
import {
  ACCEPT_GENERIC,
  ACCEPT_PROFILE_PHOTO,
  FIXED_REQUIRED_TYPES,
  MAX_DOCUMENT_BYTES,
  OTHER_NAME_MAX,
  UPLOAD_SELECT_TYPES,
  isMimeAcceptedFor,
  normalizeOtherName,
  type DocumentType,
} from "@/features/riders/documentTypes";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import { formatCnic, normalizeCnicInput } from "@/features/riders/cnic";
import { KARACHI_AREAS } from "@/features/riders/constants";
import type { AllRidersRow } from "@/types/rider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DatePickerField } from "@/components/DatePickerField";

function normalisePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

const AVATAR_PALETTE = ["#b8c4d6","#dcb8bc","#dccdb0","#c9bcd0","#b8c9c8","#bcbdd6","#cac2ba","#d4b8a5"] as const;

const STATUS_BG: Record<string, string> = { active: "#15803d", pending: "#b45309", blocked: "#dc2626", offboarded: "#6b7280" };

function avatarBg(key: string): string {
  const k = (key ?? "").trim();
  if (!k) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    const [c1, c2] = [parts[0].charAt(0), parts[0].charAt(1)];
    return (c1 + (c2 ?? "")).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}

function formatDateDisplay(iso: string | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function isoToDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function dateToIso(d: Date | undefined): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FormState {
  name: string;
  area: string;
  address: string;
  cnic: string;
  dob: string;
}

const CURRENT_YEAR = new Date().getFullYear();

interface UploadInFlight {
  typeName: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  abort: (() => void) | null;
}

export default function RiderEditPage() {
  const { t } = useTranslation();
  const { phone: phoneParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const navState = location.state as { backSearch?: string; row?: AllRidersRow } | null;
  const backSearch = navState?.backSearch ?? "";
  const backTo = `/admin/all-riders${backSearch}`;

  const targetPhone = normalisePhone(decodeURIComponent(phoneParam ?? ""));
  const seededRow =
    navState?.row && normalisePhone(navState.row.phone) === targetPhone ? navState.row : null;

  const [row, setRow] = useState<AllRidersRow | null>(seededRow);
  const [loading, setLoading] = useState(seededRow === null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const seededInitial: FormState = seededRow
    ? { name: seededRow.name ?? "", area: seededRow.area ?? "", address: "", cnic: seededRow.cnic ?? "", dob: seededRow.dob ?? "" }
    : { name: "", area: "", address: "", cnic: "", dob: "" };

  const [form, setForm] = useState<FormState>(seededInitial);
  const initialFormRef = useRef<FormState>(seededInitial);
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({ name: false, area: false, address: false, cnic: false, dob: false });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [documents, setDocuments] = useState<RiderDocument[] | null | "loading">("loading");
  const [docsUnavailable, setDocsUnavailable] = useState(false);

  const [uploadType, setUploadType] = useState<string>("");
  const [otherName, setOtherName] = useState("");
  const [otherNameError, setOtherNameError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInFlight, setUploadInFlight] = useState<UploadInFlight | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RiderDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<{ type: DocumentType; name?: string; file: File; existing: RiderDocument } | null>(null);

  const [status, setStatus] = useState<RiderStatus | null>(seededRow?.status ?? null);
  const [statusPending, setStatusPending] = useState<null | "activate" | "block" | "unblock" | "offboard" | "reactivate">(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaved, setStatusSaved] = useState<null | "active" | "blocked" | "offboarded">(null);
  const [statusUnavailable, setStatusUnavailable] = useState(false);
  const [confirmKind, setConfirmKind] = useState<null | "block" | "unblock" | "offboard" | "reactivate">(null);
  const [activatePin, setActivatePin] = useState("");
  const [activatePinTouched, setActivatePinTouched] = useState(false);

  const [pinResetOpen, setPinResetOpen] = useState(false);
  const [pinResetting, setPinResetting] = useState(false);
  const [pinResetError, setPinResetError] = useState<string | null>(null);
  const [pinResult, setPinResult] = useState<string | null>(null);
  const [pinLastReset, setPinLastReset] = useState<string | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const [pinUnavailable, setPinUnavailable] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const selectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const hasSeed = seededRow !== null;
  useEffect(() => {
    if (hasSeed) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const data = await getAllRiders();
        if (cancelled) return;
        const rows = mapAllRidersResponse(data.riders ?? []);
        const target = normalisePhone(decodeURIComponent(phoneParam ?? ""));
        const match = rows.find((r) => normalisePhone(r.phone) === target) ?? null;
        setRow(match);
        if (match) {
          const initial: FormState = { name: match.name ?? "", area: match.area ?? "", address: "", cnic: match.cnic ?? "", dob: match.dob ?? "" };
          setForm(initial);
          initialFormRef.current = initial;
          setStatus(match.status);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : t("riders.errors.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [phoneParam, t, hasSeed]);

  useEffect(() => {
    if (!row) return;
    let cancelled = false;
    (async () => {
      const docs = await getRiderDocuments(row.phone, "Rider");
      if (cancelled) return;
      if (docs === null) { setDocuments(null); setDocsUnavailable(true); }
      else { setDocuments(docs); setDocsUnavailable(false); }
    })();
    return () => { cancelled = true; };
  }, [row]);

  const docsByType = useMemo(() => {
    const map: Partial<Record<string, RiderDocument>> = {};
    if (!Array.isArray(documents)) return map;
    for (const d of documents) {
      if (d.type === "other") continue;
      const existing = map[d.type];
      if (!existing || existing.uploadedAt < d.uploadedAt) map[d.type] = d;
    }
    return map;
  }, [documents]);

  const otherDocs = useMemo(() => {
    if (!Array.isArray(documents)) return [];
    return documents.filter((d) => d.type === "other").sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
  }, [documents]);

  const receivedCount = useMemo(() => FIXED_REQUIRED_TYPES.filter((k) => docsByType[k]).length, [docsByType]);

  const dirty = useMemo(() => {
    const init = initialFormRef.current;
    return form.name.trim() !== init.name.trim() || form.area !== init.area || form.address !== init.address || normalizeCnicInput(form.cnic) !== normalizeCnicInput(init.cnic) || form.dob !== init.dob;
  }, [form]);

  const cnicDigits = normalizeCnicInput(form.cnic);
  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = t("riders.edit.validation.nameRequired");
    if (!form.area) e.area = t("riders.edit.validation.areaRequired");
    if (!cnicDigits) e.cnic = t("riders.edit.validation.cnicRequired");
    else if (cnicDigits.length !== 13) e.cnic = t("riders.edit.validation.cnicLength");
    if (!form.dob) e.dob = t("riders.edit.validation.dobRequired");
    return e;
  }, [form.name, form.area, form.dob, cnicDigits, t]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSave = dirty && !saving;

  const handleFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError(null);
  };

  const handleBack = () => { if (dirty) { setDiscardOpen(true); return; } navigate(backTo); };
  const handleDiscardConfirm = () => { setDiscardOpen(false); navigate(backTo); };

  const typeName = (type: DocumentType, docName?: string): string => {
    if (type === "other" && docName) return docName;
    return t(`riders.edit.documents.types.${type}`);
  };

  const dropzoneEnabled = useMemo(() => {
    if (!uploadType) return false;
    if (uploadType === "other") { const trimmed = otherName.trim(); return trimmed.length >= 1 && trimmed.length <= OTHER_NAME_MAX; }
    return true;
  }, [uploadType, otherName]);

  const startUpload = (type: DocumentType, file: File, customName?: string) => {
    if (!row) return;
    setUploadError(null);
    setRetryFile(null);
    const displayName = type === "other" && customName ? customName : typeName(type);
    setUploadInFlight({ typeName: displayName, fileName: file.name, sizeBytes: file.size, progress: 0, abort: null });
    setAnnounce(t("riders.edit.documents.announce.started", { type: displayName }));
    const handle = uploadRiderDocument(row.phone, "Rider", type, file, (pct) => {
      setUploadInFlight((prev) => prev ? { ...prev, progress: pct } : prev);
    }, customName);
    setUploadInFlight((prev) => prev ? { ...prev, abort: handle.abort } : prev);
    handle.promise
      .then((res) => {
        setDocuments((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          if (type === "other") {
            const norm = normalizeOtherName(customName ?? "");
            return [res.document, ...list.filter((d) => !(d.type === "other" && normalizeOtherName(d.name ?? "") === norm))];
          }
          return [res.document, ...list.filter((d) => d.type !== type)];
        });
        setUploadInFlight(null);
        setUploadType("");
        setOtherName("");
        setOtherNameError(null);
        setFlashMsg(t("riders.edit.documents.upload.done"));
        setAnnounce(t("riders.edit.documents.announce.done", { type: displayName }));
        window.setTimeout(() => setFlashMsg(null), 3000);
      })
      .catch((err) => {
        setUploadInFlight(null);
        setRetryFile(file);
        setUploadError(err instanceof Error ? err.message : t("riders.edit.documents.errors.uploadFailed"));
        setAnnounce(t("riders.edit.documents.announce.failed", { type: displayName }));
      });
  };

  const validateAndUpload = (file: File) => {
    const type = uploadType as DocumentType;
    const mime = file.type;
    if (!isMimeAcceptedFor(type, mime)) {
      setUploadError(t("riders.edit.documents.errors.unsupportedType", { type: typeName(type) }));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setUploadError(t("riders.edit.documents.errors.tooLarge", { size: (file.size / 1024 / 1024).toFixed(1) }));
      return;
    }
    const customName = type === "other" ? otherName.trim() : undefined;
    if (type === "other" && customName) {
      const norm = normalizeOtherName(customName);
      const match = otherDocs.find((d) => normalizeOtherName(d.name ?? "") === norm);
      if (match) { setReplaceTarget({ type, name: customName, file, existing: match }); return; }
    } else if (type !== "other") {
      const existing = docsByType[type];
      if (existing) { setReplaceTarget({ type, file, existing }); return; }
    }
    startUpload(type, file, customName);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    validateAndUpload(files[0]);
  };

  const handleDropzoneClick = () => {
    if (!dropzoneEnabled) { selectTriggerRef.current?.focus(); return; }
    if (uploadType === "other") {
      const trimmed = otherName.trim();
      if (!trimmed) { setOtherNameError(t("riders.edit.documents.otherNameRequired")); return; }
      if (trimmed.length > OTHER_NAME_MAX) { setOtherNameError(t("riders.edit.documents.otherNameTooLong")); return; }
    }
    fileInputRef.current?.click();
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDropzoneClick(); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!dropzoneEnabled) { setAnnounce(t("riders.edit.documents.noTypeHint")); selectTriggerRef.current?.focus(); return; }
    if (uploadType === "other") {
      const trimmed = otherName.trim();
      if (!trimmed) { setOtherNameError(t("riders.edit.documents.otherNameRequired")); return; }
      if (trimmed.length > OTHER_NAME_MAX) { setOtherNameError(t("riders.edit.documents.otherNameTooLong")); return; }
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) { setUploadError(null); validateAndUpload(files[0]); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const handleCancelUpload = () => { if (uploadInFlight?.abort) uploadInFlight.abort(); setUploadInFlight(null); };

  const handleRetryUpload = () => {
    if (!retryFile) return;
    const type = uploadType as DocumentType;
    const customName = type === "other" ? otherName.trim() : undefined;
    startUpload(type, retryFile, customName);
  };

  const confirmReplace = () => {
    if (!replaceTarget) return;
    const { type, name: customName, file } = replaceTarget;
    setReplaceTarget(null);
    startUpload(type, file, customName);
  };

  const openDeleteDialog = (doc: RiderDocument) => setDeleteTarget(doc);
  const closeDeleteDialog = () => { if (!deleting) setDeleteTarget(null); };
  const confirmDelete = async () => {
    if (!row || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRiderDocument(row.phone, "Rider", deleteTarget.id);
      setDocuments((prev) => Array.isArray(prev) ? prev.filter((d) => d.id !== deleteTarget.id) : prev);
      setDeleteTarget(null);
    } catch { setDeleteTarget(null); } finally { setDeleting(false); }
  };

  const handleAvatarFile = (files: FileList | null) => {
    if (!files || files.length === 0 || !row) return;
    const file = files[0];
    if (!isMimeAcceptedFor("profile_photo", file.type)) return;
    if (file.size > MAX_DOCUMENT_BYTES) return;
    const existing = docsByType.profile_photo;
    if (existing) { setReplaceTarget({ type: "profile_photo", file, existing }); return; }
    startAvatarUpload(file);
  };

  const startAvatarUpload = (file: File) => {
    if (!row) return;
    const handle = uploadRiderDocument(row.phone, "Rider", "profile_photo", file, () => {});
    handle.promise.then((res) => {
      setDocuments((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return [res.document, ...list.filter((d) => d.type !== "profile_photo")];
      });
    }).catch(() => {});
  };

  const isEndpointGap = (err: unknown): boolean => {
    if (!err || typeof err !== "object") return false;
    const e = err as { name?: unknown; status?: unknown };
    if (e.name !== "ApiError") return false;
    return e.status === 404 || e.status === 500;
  };

  const applyStatus = async (next: "active" | "blocked" | "offboarded", kind: "activate" | "block" | "unblock" | "offboard" | "reactivate") => {
    if (!row) return;
    setStatusPending(kind);
    setStatusError(null);
    setStatusSaved(null);
    try {
      await updateUser(row.phone, "Rider", { activationStatus: next });
      setStatus(next);
      const savedKind = next === "active" ? "active" : next;
      setStatusSaved(savedKind);
      window.setTimeout(() => setStatusSaved((s) => (s === savedKind ? null : s)), 5000);
    } catch (err) {
      if (isEndpointGap(err)) setStatusUnavailable(true);
      setStatusError(err instanceof Error ? err.message : t("riders.edit.status.saveFailed"));
    } finally {
      setStatusPending(null);
    }
  };

  const handleActivate = async () => {
    if (!row) return;
    setActivatePinTouched(true);
    if (!/^\d{6}$/.test(activatePin)) return;
    setStatusPending("activate");
    setStatusError(null);
    setStatusSaved(null);
    try {
      const res = await activateRider(row.phone, activatePin);
      if (res.success) {
        setStatus("active");
        setStatusSaved("active");
        setActivatePin("");
        setActivatePinTouched(false);
        window.setTimeout(() => setStatusSaved((s) => (s === "active" ? null : s)), 5000);
      } else {
        setStatusError(res.error ?? t("riders.edit.status.saveFailed"));
      }
    } catch (err) {
      if (isEndpointGap(err)) setStatusUnavailable(true);
      setStatusError(err instanceof Error ? err.message : t("riders.edit.status.saveFailed"));
    } finally {
      setStatusPending(null);
    }
  };

  const handleConfirmStatus = () => {
    const kind = confirmKind;
    if (!kind) return;
    setConfirmKind(null);
    if (kind === "block") void applyStatus("blocked", "block");
    else if (kind === "unblock") void applyStatus("active", "unblock");
    else if (kind === "offboard") void applyStatus("offboarded", "offboard");
    else if (kind === "reactivate") void applyStatus("active", "reactivate");
  };

  const handleResetPin = async () => {
    if (!row) return;
    setPinResetting(true);
    setPinResetError(null);
    try {
      const res = await resetRiderPin(row.phone, "Rider");
      if (res.success && res.pin) {
        setPinResult(res.pin);
        setPinLastReset(res.lastResetAt ?? new Date().toISOString());
        setPinCopied(false);
      } else {
        setPinResetError(res.error ?? t("riders.edit.pin.resetFailed"));
      }
    } catch (err) {
      if (isEndpointGap(err)) setPinUnavailable(true);
      setPinResetError(err instanceof Error ? err.message : t("riders.edit.pin.resetFailed"));
    } finally {
      setPinResetting(false);
      setPinResetOpen(false);
    }
  };

  const handleCopyPin = async () => {
    if (!pinResult) return;
    try {
      await navigator.clipboard.writeText(pinResult);
      setPinCopied(true);
      window.setTimeout(() => setPinCopied(false), 2000);
    } catch {
      setPinCopied(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ name: true, area: true, address: true, cnic: true, dob: true });
    if (hasErrors) {
      const firstInvalid = (["name", "cnic", "dob", "area"] as const).find((k) => errors[k]);
      if (firstInvalid) document.getElementById(`fqa-edit-${firstInvalid}`)?.focus();
      return;
    }
    if (!canSave || !row) return;
    const init = initialFormRef.current;
    const diff: Record<string, unknown> = {};
    if (form.name.trim() !== init.name.trim()) diff.name = form.name.trim();
    if (form.area !== init.area) diff.area = form.area;
    if (form.address !== init.address) diff.address = form.address;
    if (normalizeCnicInput(form.cnic) !== normalizeCnicInput(init.cnic)) diff.cnic = normalizeCnicInput(form.cnic);
    if (form.dob !== init.dob) diff.dob = form.dob;
    if (Object.keys(diff).length === 0) return;
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      await updateUser(row.phone, "Rider", diff);
      const nextInitial: FormState = { ...form, name: form.name.trim(), cnic: normalizeCnicInput(form.cnic) };
      initialFormRef.current = nextInitial;
      setForm(nextInitial);
      setSaved(true);
    } catch (err) { setSaveError(err instanceof Error ? err.message : t("riders.edit.saveFailed")); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <div role="alert" className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{loadError}</div>
        <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
          <ArrowLeft size={14} className="me-2" aria-hidden="true" />{t("riders.edit.backToAll")}
        </Button>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <Card className="p-6">
          <h2 className="text-base font-medium text-foreground">{t("riders.edit.notFoundTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("riders.edit.notFoundHint")}</p>
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
              <ArrowLeft size={14} className="me-2" aria-hidden="true" />{t("riders.edit.backToAll")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const cnicDisplay = form.cnic.length > 0 && cnicDigits.length === 13 ? formatCnic(cnicDigits) : form.cnic;
  const profilePhoto = docsByType.profile_photo;
  const cameraDisabled = docsUnavailable;
  const dropzoneAriaLabel = dropzoneEnabled
    ? t("riders.edit.documents.dropzoneAriaEnabled", { type: uploadType === "other" ? otherName.trim() : typeName(uploadType as DocumentType) })
    : t("riders.edit.documents.dropzoneAriaDisabled");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:gap-6 md:p-6 xl:max-w-6xl" data-testid="fqa-rider-edit-page">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="ps-1">
          <ArrowLeft size={14} className="me-2" aria-hidden="true" />{t("riders.edit.backToAll")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="relative">
          <Avatar className="size-12 md:size-16">
            {profilePhoto && <AvatarImage src={profilePhoto.downloadUrl} alt="" />}
            <AvatarFallback className="text-base font-medium" style={{ backgroundColor: avatarBg(row.phone || row.name), color: "#1f2937" }}>{initials(row.name)}</AvatarFallback>
          </Avatar>
          {!docsUnavailable && (
            <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={cameraDisabled} aria-label={t("riders.edit.documents.avatarCameraAria")} className="absolute -bottom-1 -end-1 inline-flex size-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <Camera size={12} aria-hidden="true" />
            </button>
          )}
          <input ref={avatarInputRef} type="file" accept={ACCEPT_PROFILE_PHOTO} className="sr-only" onChange={(e) => { handleAvatarFile(e.target.files); e.target.value = ""; }} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{row.name || "\u2014"}</h2>
          <div className="mt-1 flex">
            <Badge className="gap-1.5 rounded-full border-transparent px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: STATUS_BG[status ?? row.status] ?? STATUS_BG.offboarded }}>{t(`riders.common.badges.${status ?? row.status}`)}</Badge>
          </div>
        </div>
        <div className="ms-auto hidden flex-wrap items-center justify-end gap-2 md:flex">
          <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>{t("riders.edit.cancel")}</Button>
          <Button type="submit" form="fqa-rider-edit-form" disabled={!canSave} aria-busy={saving || undefined}>{saving ? t("riders.edit.saving") : t("riders.edit.save")}</Button>
        </div>
      </div>

      {saved && (<div role="status" aria-live="polite" className="rounded-md border border-success/25 bg-success-muted p-3 text-sm text-success" data-testid="fqa-edit-saved">{t("riders.edit.saved")}</div>)}
      {saveError && (<div role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{saveError}</div>)}

      <form id="fqa-rider-edit-form" onSubmit={handleSubmit} noValidate>
        <div className="xl:grid xl:grid-cols-2 xl:items-start xl:gap-6">
        <div className="contents xl:flex xl:flex-col xl:gap-6">
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-name">{t("riders.edit.fields.fullName")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
              <Input id="fqa-edit-name" value={form.name} onChange={(e) => handleFieldChange("name", e.target.value)} onBlur={() => setTouched((s) => ({ ...s, name: true }))} placeholder={t("riders.edit.placeholders.fullName")} aria-required="true" aria-invalid={touched.name && !!errors.name || undefined} aria-describedby={touched.name && errors.name ? "fqa-edit-name-error" : undefined} maxLength={120} />
              {touched.name && errors.name && (<p id="fqa-edit-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>)}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-phone" className="flex items-center gap-1.5">
                <span>{t("riders.edit.fields.phone")}</span>
                <Lock size={12} aria-hidden="true" className="text-muted-foreground/70" />
                <Tooltip><TooltipTrigger type="button" aria-label={t("riders.edit.phoneImmutable")} className="inline-flex items-center text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"><Info size={12} aria-hidden="true" /></TooltipTrigger><TooltipContent>{t("riders.edit.phoneImmutable")}</TooltipContent></Tooltip>
              </Label>
              <Input id="fqa-edit-phone" value={row.phone || ""} readOnly aria-readonly="true" tabIndex={-1} className="font-mono" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-cnic">{t("riders.edit.fields.cnic")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
              <Input id="fqa-edit-cnic" value={cnicDisplay} inputMode="numeric" onChange={(e) => handleFieldChange("cnic", normalizeCnicInput(e.target.value))} onBlur={() => setTouched((s) => ({ ...s, cnic: true }))} placeholder={t("riders.edit.placeholders.cnic")} aria-required="true" aria-invalid={touched.cnic && !!errors.cnic || undefined} aria-describedby={touched.cnic && errors.cnic ? "fqa-edit-cnic-error" : undefined} className="font-mono" />
              {touched.cnic && errors.cnic && (<p id="fqa-edit-cnic-error" role="alert" className="text-xs text-destructive">{errors.cnic}</p>)}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-dob">{t("riders.edit.fields.dob")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
              <DatePickerField id="fqa-edit-dob" value={isoToDate(form.dob)} onChange={(d) => handleFieldChange("dob", dateToIso(d))} onClose={() => setTouched((s) => ({ ...s, dob: true }))} fromYear={1940} toYear={CURRENT_YEAR - 18} ariaLabel={t("riders.edit.fields.dob")} errorMessage={touched.dob && errors.dob ? errors.dob : undefined} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-area">{t("riders.edit.fields.area")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
              <Select value={form.area || undefined} onValueChange={(v) => handleFieldChange("area", v)}>
                <SelectTrigger id="fqa-edit-area" aria-required="true" aria-invalid={touched.area && !!errors.area || undefined} aria-describedby={touched.area && errors.area ? "fqa-edit-area-error" : undefined} onBlur={() => setTouched((s) => ({ ...s, area: true }))} className="w-full"><SelectValue placeholder={t("riders.edit.placeholders.area")} /></SelectTrigger>
                <SelectContent>
                  {form.area && !KARACHI_AREAS.includes(form.area) && (<SelectItem value={form.area}>{form.area}</SelectItem>)}
                  {KARACHI_AREAS.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                </SelectContent>
              </Select>
              {touched.area && errors.area && (<p id="fqa-edit-area-error" role="alert" className="text-xs text-destructive">{errors.area}</p>)}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-address">{t("riders.edit.fields.address")}</Label>
              <Textarea id="fqa-edit-address" rows={3} value={form.address} onChange={(e) => handleFieldChange("address", e.target.value)} onBlur={() => setTouched((s) => ({ ...s, address: true }))} placeholder={t("riders.edit.placeholders.address")} maxLength={200} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-role" className="flex items-center gap-1.5"><span>{t("riders.edit.fields.role")}</span><Lock size={12} aria-hidden="true" className="text-muted-foreground/70" /></Label>
              <Input id="fqa-edit-role" value="Rider" readOnly aria-readonly="true" tabIndex={-1} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fqa-edit-joined" className="flex items-center gap-1.5"><span>{t("riders.edit.fields.joined")}</span><Lock size={12} aria-hidden="true" className="text-muted-foreground/70" /></Label>
              <Input id="fqa-edit-joined" value={formatDateDisplay(row.joinedAt)} readOnly aria-readonly="true" tabIndex={-1} />
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-4 md:mt-6 md:p-6 xl:mt-0" data-testid="fqa-rider-status">
          <section aria-labelledby="fqa-status-heading">
            <div className="flex items-center justify-between gap-2">
              <h3 id="fqa-status-heading" className="text-base font-medium text-foreground">{t("riders.edit.status.heading")}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("riders.edit.status.current")}:</span>
                <Badge className="rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: STATUS_BG[status ?? row.status] ?? STATUS_BG.offboarded }} data-testid="fqa-status-badge">{t(`riders.common.badges.${status ?? row.status}`)}</Badge>
              </div>
            </div>

            {statusSaved && (
              <div role="status" aria-live="polite" className="mt-3 rounded-md border border-success/25 bg-success-muted p-2.5 text-xs text-success">{t(`riders.edit.status.saved.${statusSaved}`)}</div>
            )}
            {statusError && (
              <div role="alert" className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 p-2.5 text-xs text-destructive">{statusError}</div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {(() => {
                const s = status ?? row.status;
                if (s === "pending") {
                  const pinErr = activatePinTouched && !/^\d{6}$/.test(activatePin);
                  return (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Label htmlFor="fqa-status-activate-pin">{t("riders.edit.status.pinLabel")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
                        <Input id="fqa-status-activate-pin" inputMode="numeric" maxLength={6} value={activatePin} onChange={(e) => { setActivatePin(e.target.value.replace(/\D/g, "").slice(0,6)); setStatusError(null); }} onBlur={() => setActivatePinTouched(true)} placeholder={t("riders.edit.status.pinPlaceholder")} aria-invalid={pinErr || undefined} aria-describedby={pinErr ? "fqa-status-activate-pin-error" : "fqa-status-activate-pin-help"} className="mt-1.5 font-mono" style={{ unicodeBidi: "plaintext" }} disabled={statusUnavailable || statusPending !== null} />
                        <p id="fqa-status-activate-pin-help" className="mt-1 text-xs text-muted-foreground">{t("riders.edit.status.pinHelp")}</p>
                        {pinErr && (<p id="fqa-status-activate-pin-error" role="alert" className="mt-1 text-xs text-destructive">{t("riders.edit.status.pinInvalid")}</p>)}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={statusUnavailable ? 0 : -1}>
                            <Button type="button" onClick={handleActivate} disabled={statusUnavailable || statusPending !== null} aria-busy={statusPending === "activate" || undefined} data-testid="fqa-status-activate">
                              {statusPending === "activate" ? (<Loader2 size={14} aria-hidden="true" className="me-2 animate-spin" />) : null}
                              {t("riders.edit.status.buttons.activate")}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {statusUnavailable && (<TooltipContent>{t("riders.edit.status.unavailable")}</TooltipContent>)}
                      </Tooltip>
                    </div>
                  );
                }
                const btns: Array<{ kind: "block" | "unblock" | "offboard" | "reactivate"; variant: "outline" | "destructive"; label: string; icon: React.ReactNode }> = [];
                if (s === "active") {
                  btns.push({ kind: "block", variant: "destructive", label: t("riders.edit.status.buttons.block"), icon: <ShieldOff size={14} aria-hidden="true" className="me-2" /> });
                  btns.push({ kind: "offboard", variant: "destructive", label: t("riders.edit.status.buttons.offboard"), icon: null });
                } else if (s === "blocked") {
                  btns.push({ kind: "unblock", variant: "outline", label: t("riders.edit.status.buttons.unblock"), icon: null });
                  btns.push({ kind: "offboard", variant: "destructive", label: t("riders.edit.status.buttons.offboard"), icon: null });
                } else if (s === "offboarded") {
                  btns.push({ kind: "reactivate", variant: "outline", label: t("riders.edit.status.buttons.reactivate"), icon: null });
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {btns.map((b) => {
                      const isPending = statusPending === b.kind;
                      const disabled = statusUnavailable || (statusPending !== null && !isPending) || isPending;
                      const btn = (
                        <Button key={b.kind} type="button" variant={b.variant === "destructive" ? "destructive" : "outline"} onClick={() => setConfirmKind(b.kind)} disabled={disabled} aria-busy={isPending || undefined} data-testid={`fqa-status-${b.kind}`}>
                          {isPending ? (<Loader2 size={14} aria-hidden="true" className="me-2 animate-spin" />) : b.icon}
                          {b.label}
                        </Button>
                      );
                      if (!statusUnavailable) return btn;
                      return (
                        <Tooltip key={b.kind}>
                          <TooltipTrigger asChild><span tabIndex={0}>{btn}</span></TooltipTrigger>
                          <TooltipContent>{t("riders.edit.status.unavailable")}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </section>
        </Card>

        <Card className="mt-4 p-4 md:mt-6 md:p-6 xl:mt-0" data-testid="fqa-rider-pin">
          <section aria-labelledby="fqa-pin-heading">
            <div className="flex items-center justify-between gap-2">
              <h3 id="fqa-pin-heading" className="text-base font-medium text-foreground">{t("riders.edit.pin.heading")}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{t("riders.edit.pin.current")}:</span>
                <span className="font-mono text-foreground" style={{ unicodeBidi: "plaintext" }}>{t("riders.edit.pin.masked")}</span>
                {pinLastReset && (
                  <span className="ms-1">{t("riders.edit.pin.lastReset", { date: formatDateDisplay(pinLastReset) })}</span>
                )}
              </div>
            </div>

            {pinResetError && (
              <div role="alert" className="mt-3 rounded-md border border-destructive/25 bg-destructive/10 p-2.5 text-xs text-destructive">{pinResetError}</div>
            )}

            <div className="mt-4">
              {pinUnavailable ? (
                <div role="status" className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{t("riders.edit.pin.unavailable")}</div>
              ) : (
                <Button type="button" variant="outline" onClick={() => { setPinResetError(null); setPinResetOpen(true); }} disabled={pinResetting} aria-busy={pinResetting || undefined} data-testid="fqa-pin-reset">
                  {pinResetting ? (<Loader2 size={14} aria-hidden="true" className="me-2 animate-spin" />) : (<KeyRound size={14} aria-hidden="true" className="me-2" />)}
                  {pinResetting ? t("riders.edit.pin.resetting") : t("riders.edit.pin.reset")}
                </Button>
              )}
            </div>
          </section>
        </Card>
        </div>

        <Card className="mt-4 p-4 md:mt-6 md:p-6 xl:mt-0" data-testid="fqa-rider-documents">
          <section aria-labelledby="fqa-docs-heading">
            <div className="flex items-center justify-between gap-2">
              <h3 id="fqa-docs-heading" className="text-base font-medium text-foreground">{t("riders.edit.documents.heading")}</h3>
              {!docsUnavailable && documents !== "loading" && (
                <p className="text-xs text-muted-foreground">{t("riders.edit.documents.summary", { received: receivedCount, total: FIXED_REQUIRED_TYPES.length })}</p>
              )}
            </div>

            {docsUnavailable ? (
              <div role="status" className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">{t("riders.edit.documents.unavailable")}</div>
            ) : documents === "loading" ? (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-4 md:gap-y-2">
                {FIXED_REQUIRED_TYPES.map((k) => <Skeleton key={k} className="h-10 w-full" />)}
              </div>
            ) : (
              <>
                <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-x-4 md:gap-y-2" aria-label={t("riders.edit.documents.listAria")}>
                  {FIXED_REQUIRED_TYPES.map((type) => {
                    const doc = docsByType[type];
                    return (
                      <li key={type} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                        <span className="truncate text-sm text-foreground">{typeName(type)}</span>
                        {doc ? (
                          <Badge className="ms-auto shrink-0 gap-1 bg-success text-white text-[10px] font-medium"><span aria-hidden="true">{"\u2713"}</span>{t("riders.edit.documents.badge.received")}</Badge>
                        ) : (
                          <Badge variant="outline" className="ms-auto shrink-0 text-[10px] font-medium">{t("riders.edit.documents.badge.missing")}</Badge>
                        )}
                        {doc && (
                          <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label={t("riders.edit.documents.actionsAria", { type: typeName(type) })}>
                            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild aria-label={t("riders.edit.documents.viewAria", { type: typeName(type) })}><a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer"><Eye size={14} aria-hidden="true" /></a></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.view")}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild aria-label={t("riders.edit.documents.downloadAria", { type: typeName(type) })}><a href={doc.downloadUrl} download={doc.filename}><Download size={14} aria-hidden="true" /></a></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.download")}</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeleteDialog(doc)} aria-label={t("riders.edit.documents.deleteAria", { type: typeName(type) })}><Trash2 size={14} aria-hidden="true" className="text-destructive" /></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.delete")}</TooltipContent></Tooltip>
                          </div>
                        )}
                      </li>
                    );
                  })}
                  {otherDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                      <span className="truncate text-sm text-foreground" dir="auto">{doc.name}</span>
                      <Badge className="ms-auto shrink-0 gap-1 bg-success text-white text-[10px] font-medium"><span aria-hidden="true">{"\u2713"}</span>{t("riders.edit.documents.badge.received")}</Badge>
                      <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label={t("riders.edit.documents.actionsAria", { type: doc.name ?? "" })}>
                        <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild aria-label={t("riders.edit.documents.viewAria", { type: doc.name ?? "" })}><a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer"><Eye size={14} aria-hidden="true" /></a></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.view")}</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" asChild aria-label={t("riders.edit.documents.downloadAria", { type: doc.name ?? "" })}><a href={doc.downloadUrl} download={doc.filename}><Download size={14} aria-hidden="true" /></a></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.download")}</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDeleteDialog(doc)} aria-label={t("riders.edit.documents.deleteAria", { type: doc.name ?? "" })}><Trash2 size={14} aria-hidden="true" className="text-destructive" /></Button></TooltipTrigger><TooltipContent>{t("riders.edit.documents.delete")}</TooltipContent></Tooltip>
                      </div>
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                {uploadInFlight ? (
                  <div className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{t("riders.edit.documents.upload.heading", { type: uploadInFlight.typeName })}</p>
                    <p className="mt-1 text-xs text-muted-foreground" dir="auto">{uploadInFlight.fileName} {"\u00b7"} {formatBytes(uploadInFlight.sizeBytes)}</p>
                    <div role="progressbar" aria-valuenow={uploadInFlight.progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("riders.edit.documents.upload.progressAria", { type: uploadInFlight.typeName })} className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="absolute top-0 bottom-0 bg-primary transition-[width] duration-150 start-0" style={{ width: `${uploadInFlight.progress}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{uploadInFlight.progress}%</span>
                      <Button type="button" variant="ghost" size="sm" onClick={handleCancelUpload} aria-label={t("riders.edit.documents.upload.cancelAria", { type: uploadInFlight.typeName })}><X size={14} aria-hidden="true" className="me-1" />{t("riders.edit.documents.upload.cancel")}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-foreground">{t("riders.edit.documents.uploadSection")}</p>
                    <div className="max-w-md">
                      <Label htmlFor="fqa-doc-type-select">{t("riders.edit.documents.typeLabel")}</Label>
                      <Select value={uploadType || undefined} onValueChange={(v) => { setUploadType(v); setOtherNameError(null); setUploadError(null); }}>
                        <SelectTrigger id="fqa-doc-type-select" ref={selectTriggerRef} className="mt-1.5 w-full" aria-required="true"><SelectValue placeholder={t("riders.edit.documents.typePlaceholder")} /></SelectTrigger>
                        <SelectContent>
                          {UPLOAD_SELECT_TYPES.map((st) => (<SelectItem key={st} value={st}>{t(`riders.edit.documents.types.${st}`)}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    {uploadType === "other" && (
                      <div className="max-w-md">
                        <Label htmlFor="fqa-doc-other-name">{t("riders.edit.documents.otherNameLabel")}<span aria-hidden="true" className="text-destructive"> *</span></Label>
                        <Input id="fqa-doc-other-name" dir="auto" value={otherName} onChange={(e) => { setOtherName(e.target.value); setOtherNameError(null); }} placeholder={t("riders.edit.documents.otherNamePlaceholder")} maxLength={OTHER_NAME_MAX} aria-required="true" aria-invalid={otherNameError ? true : undefined} aria-describedby={otherNameError ? "fqa-doc-other-name-error" : undefined} className="mt-1.5" />
                        {otherNameError && (<p id="fqa-doc-other-name-error" role="alert" className="mt-1 text-xs text-destructive">{otherNameError}</p>)}
                      </div>
                    )}

                    <div role="button" tabIndex={dropzoneEnabled ? 0 : -1} aria-disabled={!dropzoneEnabled} aria-label={dropzoneAriaLabel} onClick={handleDropzoneClick} onKeyDown={handleDropzoneKeyDown} onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`mt-1 flex min-h-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!dropzoneEnabled ? "cursor-default border-muted text-muted-foreground" : dragOver ? "border-primary bg-primary/5 ring-2 ring-primary" : "cursor-pointer border-border text-foreground hover:border-primary/50"}`}>
                      <FileUp size={20} aria-hidden="true" className={dropzoneEnabled ? "text-muted-foreground" : "text-muted-foreground/50"} />
                      <span className="text-sm">{dropzoneEnabled ? t("riders.edit.documents.dropzoneHint") : t("riders.edit.documents.noTypeHint")}</span>
                      {dropzoneEnabled && (<span className="text-xs text-muted-foreground">{t("riders.edit.documents.dropzoneFormats")}</span>)}
                    </div>

                    {uploadError && (<div className="flex flex-wrap items-center gap-2"><p role="alert" className="text-xs text-destructive">{uploadError}</p>{retryFile && (<Button type="button" variant="outline" size="sm" onClick={handleRetryUpload}>{t("riders.edit.documents.upload.retry")}</Button>)}</div>)}
                    {flashMsg && (<p role="status" className="text-xs text-success">{flashMsg}</p>)}
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept={ACCEPT_GENERIC} className="sr-only" onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }} />
                <div className="sr-only" role="status" aria-live="polite">{announce}</div>
              </>
            )}
          </section>
        </Card>
        </div>

        <div className="sticky bottom-4 mt-6 flex flex-col-reverse gap-2 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:gap-3 md:hidden">
          <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>{t("riders.edit.cancel")}</Button>
          <Button type="submit" disabled={!canSave} aria-busy={saving || undefined} data-testid="fqa-edit-save">{saving ? t("riders.edit.saving") : t("riders.edit.save")}</Button>
        </div>
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("riders.edit.discardDialog.title")}</AlertDialogTitle><AlertDialogDescription>{t("riders.edit.discardDialog.description")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("riders.edit.discardDialog.cancel")}</AlertDialogCancel><AlertDialogAction onClick={handleDiscardConfirm}>{t("riders.edit.discardDialog.confirm")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={replaceTarget !== null} onOpenChange={(o) => (o ? undefined : setReplaceTarget(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{replaceTarget ? t("riders.edit.documents.replaceDialog.title", { type: typeName(replaceTarget.type, replaceTarget.name) }) : ""}</AlertDialogTitle>
            <AlertDialogDescription>{replaceTarget ? t("riders.edit.documents.replaceDialog.description", { name: replaceTarget.existing.filename, size: formatBytes(replaceTarget.existing.sizeBytes) }) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("riders.edit.documents.replaceDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("riders.edit.documents.replaceDialog.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => (o ? undefined : closeDeleteDialog())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget ? t("riders.edit.documents.deleteDialog.title", { type: typeName(deleteTarget.type, deleteTarget.name) }) : ""}</AlertDialogTitle>
            <AlertDialogDescription>{t("riders.edit.documents.deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("riders.edit.documents.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>{deleting ? t("riders.edit.documents.deleteDialog.deleting") : t("riders.edit.documents.deleteDialog.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmKind !== null} onOpenChange={(o) => (o ? undefined : setConfirmKind(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmKind ? t(`riders.edit.status.confirm.${confirmKind}.title`) : ""}</AlertDialogTitle>
            <AlertDialogDescription>{confirmKind ? t(`riders.edit.status.confirm.${confirmKind}.description`) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{confirmKind ? t(`riders.edit.status.confirm.${confirmKind}.cancel`) : ""}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatus} className={confirmKind === "block" || confirmKind === "offboard" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}>{confirmKind ? t(`riders.edit.status.confirm.${confirmKind}.confirm`) : ""}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pinResetOpen} onOpenChange={(o) => (o || pinResetting ? undefined : setPinResetOpen(false))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("riders.edit.pin.confirm.title", { name: row.name || "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("riders.edit.pin.confirm.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pinResetting}>{t("riders.edit.pin.confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPin} disabled={pinResetting} aria-busy={pinResetting || undefined}>{pinResetting ? t("riders.edit.pin.resetting") : t("riders.edit.pin.confirm.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pinResult !== null} onOpenChange={() => undefined}>
        <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("riders.edit.pin.result.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("riders.edit.pin.result.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2 flex flex-col items-center gap-2">
            <span className="sr-only" id="fqa-pin-result-label">{t("riders.edit.pin.result.pinLabel")}</span>
            <span aria-labelledby="fqa-pin-result-label" className="rounded-md border border-border bg-muted/40 px-4 py-2 text-2xl font-mono tracking-[0.35em] text-foreground" style={{ unicodeBidi: "plaintext" }} data-testid="fqa-pin-result">{pinResult}</span>
          </div>
          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={handleCopyPin} aria-live="polite">
              <Copy size={14} aria-hidden="true" className="me-2" />{pinCopied ? t("riders.edit.pin.result.copied") : t("riders.edit.pin.result.copy")}
            </Button>
            <AlertDialogAction onClick={() => { setPinResult(null); setPinCopied(false); }}>{t("riders.edit.pin.result.done")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
