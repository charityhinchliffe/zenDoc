"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import {
  ApiError,
  deleteDocument,
  downloadDocument,
  getAccount,
  listDocuments,
  shareDocument,
  shareUrl,
  uploadDocument,
  type DocumentList,
  type LibraryView,
  type VaultDocument,
} from "@/lib/api";
import { clearSession, getSession, initialsFromName, type AccountSession } from "@/lib/session";

type GateAction = "download" | "share" | "delete";
type UnlockPhase = "idle" | "error" | "checking" | "unlocking" | "done";

type SelectedFile = {
  file: VaultDocument;
  action: GateAction;
};

const views: { id: LibraryView; label: string }[] = [
  { id: "all", label: "All documents" },
  { id: "recent", label: "Recent" },
  { id: "shared", label: "Shared" },
  { id: "trash", label: "Trash" },
];

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function Dashboard() {
  const router = useRouter();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<AccountSession | null>(null);
  const [view, setView] = useState<LibraryView>("all");
  const [library, setLibrary] = useState<DocumentList | null>(null);
  const [libraryError, setLibraryError] = useState("");
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [phase, setPhase] = useState<UnlockPhase>("idle");
  const [gateError, setGateError] = useState("");
  const [filledBoxes, setFilledBoxes] = useState(0);
  const [sharedLink, setSharedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [readyDownload, setReadyDownload] = useState<{ blob: Blob; filename: string } | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    getAccount(current.accessToken)
      .then((account) => {
        if (cancelled) return;
        setSession({
          ...current,
          id: account.id,
          email: account.email,
          fullName: account.full_name,
        });
      })
      .catch((caught) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        setSession(current);
        setLibraryError(caught instanceof Error ? caught.message : "Could not open the library.");
        setLoadingLibrary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoadingLibrary(true);
    listDocuments(session.accessToken, view)
      .then((result) => {
        if (cancelled) return;
        setLibrary(result);
        setLibraryError("");
      })
      .catch((caught) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        setLibraryError(caught instanceof Error ? caught.message : "Could not load documents.");
      })
      .finally(() => {
        if (!cancelled) setLoadingLibrary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session, view, refreshKey, router]);

  const documents = library?.documents ?? [];
  const filteredFiles = useMemo(
    () => documents.filter((file) => file.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [documents, query],
  );

  useEffect(() => {
    if (!selected) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "unlocking" && phase !== "checking") closeUnlock();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, phase]);

  const openUnlock = (file: VaultDocument, action: GateAction) => {
    setSelected({ file, action });
    setMasterPassword("");
    setPhase("idle");
    setGateError("");
    setFilledBoxes(0);
    setSharedLink("");
    setCopied(false);
    setReadyDownload(null);
  };

  const closeUnlock = () => {
    if (phase === "unlocking" || phase === "checking") return;
    setSelected(null);
    setMasterPassword("");
    setPhase("idle");
    setGateError("");
    setFilledBoxes(0);
    setSharedLink("");
    setCopied(false);
    setReadyDownload(null);
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const runGate = async (action: GateAction, file: VaultDocument, password: string) => {
    if (!session) throw new ApiError(401, "Not authenticated");
    if (action === "download") {
      const result = await downloadDocument(session.accessToken, file.id, password);
      return { blob: result.blob, filename: result.filename || file.name };
    }
    if (action === "share") {
      const result = await shareDocument(session.accessToken, file.id, password);
      setSharedLink(shareUrl(result.path));
      setRefreshKey((value) => value + 1);
      return null;
    }
    await deleteDocument(session.accessToken, file.id, password);
    setRefreshKey((value) => value + 1);
    return null;
  };

  const unlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || phase === "unlocking" || phase === "checking") return;

    if (phase === "done") {
      if (selected.action === "download" && readyDownload) {
        saveBlob(readyDownload.blob, readyDownload.filename);
      }
      if (selected.action === "share" && sharedLink) {
        await navigator.clipboard.writeText(sharedLink);
        setCopied(true);
      }
      return;
    }

    setPhase("checking");
    setGateError("");
    setFilledBoxes(0);
    try {
      const download = await runGate(selected.action, selected.file, masterPassword);
      setPhase("unlocking");
      for (let box = 1; box <= 8; box += 1) {
        await wait(140);
        setFilledBoxes(box);
      }
      if (download) {
        setReadyDownload(download);
        saveBlob(download.blob, download.filename);
      }
      setPhase("done");
      if (selected.action === "delete") {
        await wait(500);
        setSelected(null);
        setPhase("idle");
        setMasterPassword("");
      }
    } catch (caught) {
      setPhase("error");
      setFilledBoxes(0);
      setGateError(caught instanceof Error ? caught.message : "Incorrect master password.");
    }
  };

  const uploadFile = async (file: File | undefined) => {
    if (!file || !session) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadDocument(session.accessToken, file);
      setView("all");
      setRefreshKey((value) => value + 1);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      setUploadError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (uploadInput.current) uploadInput.current.value = "";
    }
  };

  const logOut = () => {
    clearSession();
    router.push("/login");
  };

  if (!session) {
    return (
      <div className="dashboard-page">
        <p className="library-status">Opening vault…</p>
      </div>
    );
  }

  const used = library?.storage_used_bytes ?? 0;
  const quota = library?.storage_quota_bytes ?? 5 * 1024 * 1024 * 1024;
  const usedPercent = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const viewLabel = views.find((item) => item.id === view)?.label ?? "All documents";
  const gateTitle =
    selected?.action === "share" ? "Unlock share" : selected?.action === "delete" ? "Unlock delete" : "Unlock download";
  const gateVerb =
    selected?.action === "share" ? "Sharing…" : selected?.action === "delete" ? "Deleting…" : "Decrypting…";

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link href="/" aria-label="zenDoc home">
            <Wordmark />
          </Link>

          <label className="dashboard-search">
            <SearchIcon />
            <span className="sr-only">Search documents</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your vault"
            />
          </label>

          <div className="dashboard-account">
            <span className="dashboard-status">
              <i />
              Vault online
            </span>
            <span className="avatar" aria-hidden="true">
              {initialsFromName(session.fullName)}
            </span>
            <button className="dashboard-logout" type="button" onClick={logOut}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
          <p className="sidebar-label">Workspace</p>
          <nav>
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === view ? "is-current" : undefined}
                onClick={() => setView(item.id)}
              >
                {item.id === "all" ? <GridIcon /> : null}
                {item.id === "recent" ? <ClockIcon /> : null}
                {item.id === "shared" ? <ShareIcon /> : null}
                {item.id === "trash" ? <TrashIcon /> : null}
                {item.label}
                {item.id === view ? <span>{documents.length}</span> : null}
              </button>
            ))}
          </nav>

          <div className="storage-meter">
            <div>
              <span>Storage</span>
              <b>
                {formatBytes(used)} / {formatBytes(quota)}
              </b>
            </div>
            <i>
              <span style={{ width: `${used > 0 ? Math.max(usedPercent, 1) : 0}%` }} />
            </i>
            <p>{used === 0 ? "Your encrypted vault is empty." : "Your encrypted vault has room."}</p>
          </div>
        </aside>

        <main className="dashboard-main" id="documents">
          <div className="dashboard-titlebar">
            <div>
              <p className="eyebrow">
                <i aria-hidden="true" />
                Private library
              </p>
              <h1>Your documents</h1>
              <p>Signed in as {session.email}. Download, share, and delete wait behind the master password.</p>
            </div>
            <div className="upload-control">
              <input
                ref={uploadInput}
                type="file"
                hidden
                onChange={(event) => uploadFile(event.target.files?.[0])}
              />
              <button
                className="btn btn-primary upload-button"
                type="button"
                disabled={uploading}
                onClick={() => uploadInput.current?.click()}
              >
                <PlusIcon />
                {uploading ? "Uploading…" : "Upload file"}
              </button>
              {uploadError ? (
                <p className="auth-error" role="alert">
                  {uploadError}
                </p>
              ) : null}
            </div>
          </div>

          <section className="dashboard-stats" aria-label="Vault summary">
            <article>
              <span className="stat-icon">
                <FileIcon />
              </span>
              <div>
                <strong>{documents.length}</strong>
                <p>{view === "trash" ? "In trash" : view === "shared" ? "Shared files" : "Encrypted files"}</p>
              </div>
            </article>
            <article>
              <span className="stat-icon">
                <LockIcon />
              </span>
              <div>
                <strong>1</strong>
                <p>Master-password gate</p>
              </div>
            </article>
            <article className="password-hint">
              <div>
                <p>Master password</p>
                <strong className="gate-rule">Download, share, and delete</strong>
              </div>
              <span>Your account password cannot open these.</span>
            </article>
          </section>

          <div className="library-switch" role="tablist" aria-label="Library views">
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === view ? "is-current" : undefined}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className="documents-panel glass" id={view}>
            <header>
              <div>
                <h2>{viewLabel}</h2>
                <p>
                  {loadingLibrary
                    ? "Loading documents…"
                    : `${filteredFiles.length} ${view === "trash" ? "trashed" : "sealed"} files`}
                </p>
              </div>
            </header>

            {libraryError ? (
              <p className="empty-files" role="alert">
                {libraryError}
              </p>
            ) : null}

            <div className="documents-table" role="table" aria-label="Documents">
              <div className="document-row document-heading" role="row">
                <span role="columnheader">Name</span>
                <span role="columnheader">Last modified</span>
                <span role="columnheader">Size</span>
                <span role="columnheader">Security</span>
                <span role="columnheader" className="sr-only">
                  Actions
                </span>
              </div>

              {filteredFiles.map((file) => (
                <div className="document-row" role="row" key={file.id}>
                  <div className="document-name" role="cell">
                    <span className="document-icon">
                      <FileIcon />
                    </span>
                    <div>
                      <strong>{file.name}</strong>
                      <span>{file.kind}</span>
                    </div>
                  </div>
                  <span role="cell">{formatUpdated(file.updated_at)}</span>
                  <span role="cell">{formatBytes(file.size_bytes)}</span>
                  <span role="cell" className="encrypted-badge">
                    <LockIcon />
                    Encrypted
                  </span>
                  <div className="row-actions" role="cell">
                    <button
                      type="button"
                      className="download-button"
                      onClick={() => openUnlock(file, "download")}
                      aria-label={`Download ${file.name}`}
                    >
                      <DownloadIcon />
                      <span className="action-label">Download</span>
                    </button>
                    {view !== "trash" ? (
                      <>
                        <button
                          type="button"
                          className="download-button"
                          onClick={() => openUnlock(file, "share")}
                          aria-label={`Share ${file.name}`}
                        >
                          <ShareIcon />
                          <span className="action-label">Share</span>
                        </button>
                        <button
                          type="button"
                          className="download-button"
                          onClick={() => openUnlock(file, "delete")}
                          aria-label={`Delete ${file.name}`}
                        >
                          <TrashIcon />
                          <span className="action-label">Delete</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}

              {!loadingLibrary && filteredFiles.length === 0 ? (
                <p className="empty-files">
                  {query
                    ? `No documents match “${query}”.`
                    : view === "trash"
                      ? "Trash is empty."
                      : view === "shared"
                        ? "No shared documents yet."
                        : "Upload a file to start your library."}
                </p>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      {selected ? (
        <div
          className="unlock-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeUnlock();
          }}
        >
          <section
            className={`unlock-card ${phase === "error" ? "is-error" : ""} ${phase === "unlocking" ? "is-unlocking" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-title"
          >
            <button
              type="button"
              className="unlock-close"
              onClick={closeUnlock}
              disabled={phase === "unlocking" || phase === "checking"}
              aria-label="Close"
            >
              ×
            </button>

            <p className="gate-kicker">Master password</p>
            <h2 className="gate-title" id="unlock-title">
              {gateTitle}
            </h2>
            <p>{selected.file.name} stays sealed until this password is entered.</p>

            <form onSubmit={unlock}>
              <label className="unlock-input-label">
                <span>Master password</span>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(event) => {
                    setMasterPassword(event.target.value);
                    if (phase === "error") setPhase("idle");
                  }}
                  autoFocus
                  autoComplete="off"
                  placeholder="Master password"
                  disabled={phase === "unlocking" || phase === "checking" || phase === "done"}
                />
              </label>

              {phase === "unlocking" || phase === "done" ? (
                <div className="pin unlock-pin" aria-label={`${filledBoxes} of 8 decryption steps complete`}>
                  {Array.from({ length: 8 }, (_, index) => (
                    <i key={index} className={index < filledBoxes ? "is-filled" : undefined} />
                  ))}
                </div>
              ) : null}

              {phase === "done" && selected.action === "share" && sharedLink ? (
                <label className="share-result">
                  <span>Share link</span>
                  <input readOnly value={sharedLink} onFocus={(event) => event.currentTarget.select()} />
                </label>
              ) : null}

              <div className="unlock-feedback" aria-live="polite">
                {phase === "error" ? <p className="unlock-error">{gateError}</p> : null}
                {phase === "unlocking" ? <p>{gateVerb}</p> : null}
                {phase === "done" && selected.action === "download" ? (
                  <p className="unlock-success">
                    <CheckIcon />
                    File decrypted
                  </p>
                ) : null}
                {phase === "done" && selected.action === "share" ? (
                  <p className="unlock-success">
                    <CheckIcon />
                    {copied ? "Link copied" : "Share link ready"}
                  </p>
                ) : null}
                {phase === "done" && selected.action === "delete" ? (
                  <p className="unlock-success">
                    <CheckIcon />
                    Moved to trash
                  </p>
                ) : null}
              </div>

              <button
                className="btn btn-primary unlock-submit"
                type="submit"
                disabled={
                  phase === "unlocking" ||
                  phase === "checking" ||
                  (phase !== "done" && !masterPassword) ||
                  (phase === "done" && selected.action === "delete")
                }
              >
                {phase === "checking"
                  ? "Checking…"
                  : phase === "unlocking"
                  ? gateVerb
                  : phase === "done" && selected.action === "share"
                    ? "Copy link"
                    : phase === "done" && selected.action === "download"
                      ? "Download again"
                      : phase === "done"
                        ? "Done"
                        : "Confirm password"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const shown = unit === 0 || value >= 10 ? value.toFixed(unit === 0 ? 0 : 0) : value.toFixed(1);
  return `${shown} ${units[unit]}`;
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 4.5 4.5" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3.5h8.5L19 8v12.5H6v-17Z" />
      <path d="M14 4v4.5h4.5M9 13h7M9 16.5h5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <rect x="14" y="14" width="6" height="6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="2" />
      <circle cx="17.5" cy="6" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="m8 11 7.5-4M8 13l7.5 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}
