import { Wordmark } from "@/components/Wordmark";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Security", href: "#security" },
      { label: "Pricing", href: "#top" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Careers", href: "#top" },
      { label: "Press", href: "#top" },
      { label: "Contact", href: "mailto:hello@zendoc.example" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#top" },
      { label: "Terms", href: "#top" },
      { label: "Security notes", href: "#security" },
      { label: "Status", href: "#top" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-main">
          <div className="footer-brand">
            <Wordmark />
            <p>
              Document storage with the clutter taken out, and a second lock on
              every file that is shared, downloaded, or deleted.
            </p>
            <p className="footer-address">
              zenDoc, Inc.
              <br />
              120 King Street, Suite 400
              <br />
              San Francisco, CA 94107
              <br />
              <a href="mailto:hello@zendoc.example">hello@zendoc.example</a>
              <br />
              +1 (415) 555-0198
            </p>
          </div>

          <div className="footer-links">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="footer-label">{column.title}</p>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="access" id="get-started">
          <div>
            <p className="eyebrow">
              <i aria-hidden="true" />
              Your private vault
            </p>
            <h2>Put a second lock on every file.</h2>
            <p>
              Create an account to start your library, or return to the vault
              you already protect.
            </p>
          </div>
          <div className="access-actions">
            <a className="btn btn-ghost" href="/login">
              Log in
            </a>
            <a className="btn btn-primary" href="/signup">
              Sign up
            </a>
          </div>
        </div>

        <div className="footer-base">
          <ul className="social">
            <li>
              <a href="https://twitter.com/zendoc" target="_blank" rel="noopener noreferrer">
                <XIcon />
                Twitter
              </a>
            </li>
            <li>
              <a href="https://instagram.com/zendoc" target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                Instagram
              </a>
            </li>
            <li>
              <a href="https://facebook.com/zendoc" target="_blank" rel="noopener noreferrer">
                <MetaIcon />
                Meta
              </a>
            </li>
          </ul>
          <p className="status">
            <i aria-hidden="true" />
            All gates operational
          </p>
          <p className="legal-note">
            © 2026 zenDoc, Inc. All rights reserved. Pricing, careers, press,
            and system status on this page are placeholders.
          </p>
        </div>
      </div>
    </footer>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5 19 19M19 5 5 19" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.6" cy="7.4" r="0.8" fill="currentColor" />
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 14.5c.2-3 2.2-6 4.6-6 1.7 0 2.6 1.1 3.9 3.2 1.3-2.1 2.2-3.2 3.9-3.2 2.4 0 4.4 3 4.6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M3.5 14.5c.4 2.2 2 3.8 3.8 3.8 1.8 0 2.7-1.2 4.7-4.3 2 3.1 2.9 4.3 4.7 4.3 1.8 0 3.4-1.6 3.8-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
