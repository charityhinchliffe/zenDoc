const layers = [
  {
    index: "01",
    title: "Account login",
    body: "The outer door. Email and password open zenDoc and show the library. At this layer nothing is shared, downloaded, or destroyed.",
  },
  {
    index: "02",
    title: "Master password",
    body: "The action door. Share, download, and delete are refused until this second secret is entered. It is not your account password, and an open session still has to pass it.",
  },
  {
    index: "03",
    title: "Server-side encryption",
    body: "The file itself. On our servers every document is encrypted with military-grade cryptography before it is stored, so the copy at rest is not a readable file on a disk.",
  },
];

export function SecurityLayers() {
  return (
    <section className="section security" id="security">
      <div className="shell security-grid">
        <div className="security-copy">
          <p className="eyebrow">
            <i aria-hidden="true" />
            Three layers of security
          </p>
          <h2>A file, wrapped three times.</h2>
          <p className="lede">
            Each layer does a different job. A lost laptop, a guessed inbox, or
            a look inside the machines is still not the document.
          </p>
        </div>

        <figure className="security-art">
          <VaultDiagram />
          <figcaption>
            Outer frame, account login. Middle frame, master password. Core,
            military-grade encryption around the file.
          </figcaption>
        </figure>

        <ol className="layer-list">
          {layers.map((layer) => (
            <li key={layer.index}>
              <span className="diamond-index" aria-hidden="true">
                <b>{layer.index}</b>
              </span>
              <div>
                <h3>{layer.title}</h3>
                <p>{layer.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function VaultDiagram() {
  return (
    <svg className="diagram" viewBox="0 0 640 640" role="img" aria-label="Three nested glass diamonds protecting a document">
      <defs>
        <linearGradient id="ring-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="32%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff2b3a" stopOpacity="0.55" />
        </linearGradient>
        <filter id="core-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <circle cx="320" cy="320" r="78" fill="#ff2b3a" opacity="0.22" filter="url(#core-glow)" />
      <line className="axis" x1="320" y1="36" x2="320" y2="604" />

      <g className="rings" transform="rotate(45 320 320)">
        <rect className="ring ring-outer" x="130" y="130" width="380" height="380" rx="34" />
        <rect className="ring ring-mid" x="195" y="195" width="250" height="250" rx="26" />
        <rect className="ring ring-core" x="254" y="254" width="132" height="132" rx="18" />
      </g>

      <g className="diagram-marks" aria-hidden="true">
        <rect x="316" y="46" width="8" height="8" />
        <rect x="586" y="316" width="8" height="8" />
        <rect x="316" y="586" width="8" height="8" />
        <rect x="46" y="316" width="8" height="8" />
      </g>

      <g className="diagram-doc">
        <path d="M304 292h22l12 12v40h-34v-52Z" />
        <path d="M326 292v12h12" />
        <path d="M310 322h16M310 330h12M310 338h14" />
      </g>

      <g className="diagram-tags">
        <text x="320" y="118" textAnchor="middle">
          01
        </text>
        <text x="320" y="196" textAnchor="middle">
          02
        </text>
        <text x="320" y="392" textAnchor="middle">
          03
        </text>
      </g>
    </svg>
  );
}
