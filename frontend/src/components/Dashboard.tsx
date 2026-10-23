"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import {
  clearDemoSession,
  getDemoSession,
  initialsFromName,
  type DemoSession,
} from "@/lib/demoSession";

const MASTER_PASSWORD = "zen-demo";

type DemoFile = {
  id: string;
  name: string;
  kind: string;
  size: string;
  updated: string;
  href: string;
};

const files: DemoFile[] = [
  {
    id: "board-minutes",
    name: "Board-minutes.txt",
    kind: "Text document",
    size: "384 B",
    updated: "Today, 09:42",
    href: "/demo-files/board-minutes.txt",
  },
  {
    id: "project-brief",
    name: "Project-brief.txt",
    kind: "Text document",
    size: "412 B",
    updated: "Yesterday, 16:18",
    href: "/demo-files/project-brief.txt",
  },
  {
    id: "security-notes",
    name: "Security-notes.txt",
    kind: "Text document",
    size: "489 B",
    updated: "20 Oct 2026",
    href: "/demo-files/security-notes.txt",
  },
];

type UnlockPhase = "idle" | "error" | "unlocking" | "decrypted";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [query, setQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<DemoFile | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [phase, setPhase] = useState<UnlockPhase>("idle");
  const [filledBoxes, setFilledBoxes] = useState(0);

  useEffect(() => {
    const current = getDemoSession();
    if (!current) {
      router.replace("/login");
      return;
    }
    setSession(current);
  }, [router]);

  const filteredFiles = useMemo(
    () =>
      files.filter((file) =>
        file.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),
    [query],
  );

  useEffect(() => {
    if (!selectedFile) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && phase !== "unlocking") {
        setSelectedFile(null);
        setMasterPassword("");
        setPhase("idle");
        setFilledBoxes(0);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedFile, phase]);

  const openUnlock = (file: DemoFile) => {
    setSelectedFile(file);
    setMasterPassword("");
    setPhase("idle");
    setFilledBoxes(0);
  };

  const closeUnlock = () => {
    if (phase === "unlocking") return;
    setSelectedFile(null);
    setMasterPassword("");
    setPhase("idle");
    setFilledBoxes(0);
  };

  const downloadFile = async (file: DemoFile) => {
    const response = await fetch(file.href);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const unlockAndDownload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || phase === "unlocking") return;

    if (phase === "decrypted") {
      await downloadFile(selectedFile);
      return;
    }

    if (masterPassword !== MASTER_PASSWORD) {
      setPhase("error");
      setFilledBoxes(0);
      return;
    }

    setPhase("unlocking");
    setFilledBoxes(0);

    for (let box = 1; box <= 8; box += 1) {
      await wait(140);
      setFilledBoxes(box);
    }

    setPhase("decrypted");
    await wait(720);
    await downloadFile(selectedFile);
  };

  const logOut = () => {
    clearDemoSession();
    router.push("/login");
  };

  if (!session) return null;

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
              {initialsFromName(session.name)}
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
            <a className="is-current" href="#documents">
              <GridIcon />
              All documents
              <span>3</span>
            </a>
            <a href="#recent">
              <ClockIcon />
              Recent
            </a>
            <a href="#shared">
              <ShareIcon />
              Shared
            </a>
            <a href="#trash">
              <TrashIcon />
              Trash
            </a>
          </nav>

          <div className="storage-meter">
            <div>
              <span>Storage</span>
              <b>1.3 KB / 5 GB</b>
            </div>
            <i>
              <span />
            </i>
            <p>Your encrypted vault has plenty of room.</p>
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
              <p>
                Signed in as {session.email}. Every download waits behind the
                master password.
              </p>
            </div>
            <button className="btn btn-primary upload-button" type="button">
              <PlusIcon />
              Upload file
            </button>
          </div>

          <section className="dashboard-stats" aria-label="Vault summary">
            <article>
              <span className="stat-icon">
                <FileIcon />
              </span>
              <div>
                <strong>3</strong>
                <p>Encrypted files</p>
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
                <p>Demo master password</p>
                <code>{MASTER_PASSWORD}</code>
              </div>
              <span>Use this for every sample file</span>
            </article>
          </section>

          <section className="documents-panel glass" id="recent">
            <header>
              <div>
                <h2>All documents</h2>
                <p>{filteredFiles.length} sealed files</p>
              </div>
              <button type="button" className="filter-button">
                <FilterIcon />
                Filter
              </button>
            </header>

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
                  <span role="cell">{file.updated}</span>
                  <span role="cell">{file.size}</span>
                  <span role="cell" className="encrypted-badge">
                    <LockIcon />
                    Encrypted
                  </span>
                  <button
                    type="button"
                    className="download-button"
                    onClick={() => openUnlock(file)}
                    aria-label={`Download ${file.name}`}
                  >
                    <DownloadIcon />
                    Download
                  </button>
                </div>
              ))}

              {filteredFiles.length === 0 ? (
                <p className="empty-files">No documents match “{query}”.</p>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      {selectedFile ? (
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
              disabled={phase === "unlocking"}
              aria-label="Close"
            >
              ×
            </button>

            <p className="gate-kicker">Master password</p>
            <h2 className="gate-title" id="unlock-title">
              Unlock download
            </h2>
            <p>
              {selectedFile.name} stays sealed until this password is entered.
            </p>

            <form onSubmit={unlockAndDownload}>
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
                  placeholder="zen-demo"
                  disabled={phase === "unlocking" || phase === "decrypted"}
                />
              </label>

              {phase === "unlocking" || phase === "decrypted" ? (
                <div
                  className="pin unlock-pin"
                  aria-label={`${filledBoxes} of 8 decryption steps complete`}
                >
                  {Array.from({ length: 8 }, (_, index) => (
                    <i
                      key={index}
                      className={index < filledBoxes ? "is-filled" : undefined}
                    />
                  ))}
                </div>
              ) : null}

              <div className="unlock-feedback" aria-live="polite">
                {phase === "error" ? (
                  <p className="unlock-error">Incorrect master password. Try zen-demo.</p>
                ) : null}
                {phase === "unlocking" ? <p>Decrypting file…</p> : null}
                {phase === "decrypted" ? (
                  <p className="unlock-success">
                    <CheckIcon />
                    File decrypted
                  </p>
                ) : null}
              </div>

              <button
                className="btn btn-primary unlock-submit"
                type="submit"
                disabled={phase === "unlocking" || (!masterPassword && phase !== "decrypted")}
              >
                {phase === "unlocking"
                  ? "Decrypting…"
                  : phase === "decrypted"
                    ? "Download again"
                    : "Confirm password"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
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

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
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
