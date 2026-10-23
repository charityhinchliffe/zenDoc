const steps = [
  {
    index: "01",
    title: "A plain library",
    body: "Drop a document in. Give it a name. Find it later with folders and search. There is no feed, no chatter, and nothing else competing with the file.",
  },
  {
    index: "02",
    title: "A gate on every move",
    body: "The account password lets you look. It does not let you share a link, download a copy, or delete what is stored. Those three actions wait for a separate master password.",
  },
  {
    index: "03",
    title: "Ciphertext on the server",
    body: "After the gate, the file still does not sit in the clear. zenDoc encrypts every document on the server with military-grade cryptography before it rests.",
  },
];

const rows = [
  {
    action: "Open the library",
    typical: "Account login",
    zendoc: "Account login",
  },
  {
    action: "Download a file",
    typical: "Allowed once you are in",
    zendoc: "Master password",
  },
  {
    action: "Share a file",
    typical: "Often a link away",
    zendoc: "Master password",
  },
  {
    action: "Delete a file",
    typical: "A confirm click",
    zendoc: "Master password",
  },
  {
    action: "Copy on the server",
    typical: "Stored with the platform",
    zendoc: "Military-grade encryption",
  },
];

export function HowItWorks() {
  return (
    <section className="section how" id="how">
      <div className="watermark" aria-hidden="true" />
      <div className="shell">
        <header className="section-head">
          <p className="eyebrow">
            <i aria-hidden="true" />
            How the platform works
          </p>
          <h2>Store it like a folder. Move it like a vault.</h2>
          <p className="lede">
            Dropbox made files easy to pass around once you are signed in.
            zenDoc keeps that ease for storing and finding documents, then adds
            a rule those drives do not: share, download, and delete are locked
            behind a master password. Looking at the library is not the same
            secret as letting a file leave.
          </p>
        </header>

        <ol className="steps">
          {steps.map((step) => (
            <li key={step.index} className="step glass">
              <span className="step-index">{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="compare-block">
          <div className="compare-intro">
            <h3>Where a normal drive stays open</h3>
            <p>
              A signed-in session is enough for most storage products. zenDoc
              splits “I can see it” from “I can move it.”
            </p>
          </div>
          <div className="compare-wrap">
            <table>
              <caption className="sr-only">
                How zenDoc handles file actions compared with a typical drive
                such as Dropbox
              </caption>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Typical drive</th>
                  <th scope="col">zenDoc</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.action}>
                    <th scope="row">{row.action}</th>
                    <td data-label="Typical drive">{row.typical}</td>
                    <td data-label="zenDoc">{row.zendoc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
