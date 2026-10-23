import { FluidBackdrop } from "@/components/FluidBackdrop";
import { Header } from "@/components/Header";

const files = [
  { name: "Term-sheet.pdf", state: "Sealed" },
  { name: "Board-minutes.pdf", state: "Held", active: true },
  { name: "Option-grants.xlsx", state: "Sealed" },
];

export function Hero() {
  return (
    <section className="hero" id="top">
      <Header />
      <FluidBackdrop className="fluid-wrap" />
      <div className="hero-wash" aria-hidden="true" />

      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <i aria-hidden="true" />
            Document storage, simplified
          </p>
          <h1>
            The simple vault
            <br />
            with a <em>second lock.</em>
          </h1>
          <p className="lede">
            zenDoc is a quieter kind of file storage. Sign in and the library
            is right there. Share, download, or delete, and a master password
            stands in the way — then military-grade encryption keeps the server
            copy unreadable.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="/signup">
              Sign up
              <Diamond />
            </a>
            <a className="btn btn-ghost" href="/login">
              Log in
            </a>
            <a className="hero-inline-link" href="#how">
              How it works
            </a>
          </div>
          <ul className="hero-points">
            <li>Account login opens the library</li>
            <li>Master password moves a file</li>
            <li>Encryption holds the server copy</li>
          </ul>
        </div>

        <div className="stage" aria-hidden="true">
          <article className="window">
            <header className="window-bar">
              <span className="window-name">Library</span>
              <span className="squares">
                <i />
                <i />
                <i />
              </span>
            </header>
            <ul className="file-list">
              {files.map((file) => (
                <li key={file.name} className={file.active ? "is-active" : undefined}>
                  <FileGlyph />
                  <span>{file.name}</span>
                  <em>{file.state}</em>
                </li>
              ))}
            </ul>
            <footer className="window-foot">3 documents · vault idle</footer>
          </article>

          <aside className="gate">
            <p className="gate-kicker">Master password</p>
            <p className="gate-title">Unlock download</p>
            <p>Board-minutes.pdf stays sealed until this password is entered.</p>
            <div className="pin" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <i key={index} className={index < 5 ? "is-filled" : undefined} />
              ))}
            </div>
            <span className="btn btn-primary gate-btn">Confirm password</span>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="btn-diamond">
      <path d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5Z" fill="currentColor" />
    </svg>
  );
}

function FileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="file-glyph" aria-hidden="true">
      <path
        d="M6 3.5h8.2L19 8.3V20.5H6V3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M14 3.8V8.4H18.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
