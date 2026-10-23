"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FluidBackdrop } from "@/components/FluidBackdrop";
import { Wordmark } from "@/components/Wordmark";
import { saveDemoSession } from "@/lib/demoSession";

type AuthPageProps = {
  mode: "login" | "signup";
};

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim() || "Charity Hinchliffe";
    const email = String(form.get("email") ?? "").trim() || "demo@zendoc.test";

    setSubmitting(true);
    saveDemoSession({ name, email });
    window.setTimeout(() => router.push("/dashboard"), 280);
  };

  return (
    <main className="auth-page">
      <FluidBackdrop className="auth-fluid" />
      <div className="auth-shade" aria-hidden="true" />

      <div className="auth-center">
        <Link className="auth-logo" href="/" aria-label="zenDoc home">
          <Wordmark />
        </Link>

        <section className="auth-card glass" aria-labelledby="auth-title">
          <h1 id="auth-title">{isLogin ? "Log in" : "Create account"}</h1>
          <p className="auth-note">
            Dummy access for this prototype. Any valid email and 12-character
            password will open the vault.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin ? (
              <label>
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  defaultValue="Charity Hinchliffe"
                  required
                />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue="demo@zendoc.test"
                required
              />
            </label>

            <label>
              <span>Account password</span>
              <input
                type="password"
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="At least 12 characters"
                minLength={12}
                defaultValue="DemoPassword!"
                required
              />
            </label>

            {!isLogin ? (
              <label>
                <span>Confirm account password</span>
                <input
                  type="password"
                  name="password-confirmation"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  minLength={12}
                  defaultValue="DemoPassword!"
                  required
                />
              </label>
            ) : null}

            <label className="auth-check">
              <input type="checkbox" name={isLogin ? "remember" : "terms"} required={!isLogin} />
              <span>
                {isLogin
                  ? "Keep this account signed in on this device"
                  : "I agree to the placeholder Terms and Privacy Policy"}
              </span>
            </label>

            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Opening vault…" : isLogin ? "Log in" : "Sign up"}
              <span aria-hidden="true">◆</span>
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <Link href={isLogin ? "/signup" : "/login"}>
              {isLogin ? "Sign up" : "Log in"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
