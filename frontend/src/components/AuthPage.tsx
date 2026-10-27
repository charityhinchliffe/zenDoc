"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FluidBackdrop } from "@/components/FluidBackdrop";
import { Wordmark } from "@/components/Wordmark";
import { ApiError, login, sessionFromAuth, signup } from "@/lib/api";
import { saveSession } from "@/lib/session";

type AuthPageProps = {
  mode: "login" | "signup";
};

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const remember = form.get("remember") === "on";

    if (!isLogin) {
      const confirmation = String(form.get("password-confirmation") ?? "");
      const masterPassword = String(form.get("master-password") ?? "");
      const masterConfirmation = String(form.get("master-password-confirmation") ?? "");
      if (password !== confirmation) {
        setError("Account passwords do not match.");
        return;
      }
      if (masterPassword !== masterConfirmation) {
        setError("Master passwords do not match.");
        return;
      }
      if (password === masterPassword) {
        setError("Master password must be different from the account password.");
        return;
      }

      setSubmitting(true);
      try {
        const result = await signup({
          fullName: String(form.get("name") ?? "").trim(),
          email,
          password,
          masterPassword,
        });
        saveSession(sessionFromAuth(result), true);
        router.push("/dashboard");
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      saveSession(sessionFromAuth(result), remember);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
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
            {isLogin
              ? "Email and password open the library. They do not download, share, or delete a file."
              : "The account password opens the library. The master password is the separate gate for download, share, and delete."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin ? (
              <label>
                <span>Name</span>
                <input type="text" name="name" autoComplete="name" placeholder="Your name" required />
              </label>
            ) : null}

            <label>
              <span>Email address</span>
              <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
            </label>

            <label>
              <span>Account password</span>
              <input
                type="password"
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="At least 12 characters"
                minLength={12}
                required
              />
            </label>

            {!isLogin ? (
              <>
                <label>
                  <span>Confirm account password</span>
                  <input
                    type="password"
                    name="password-confirmation"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    minLength={12}
                    required
                  />
                </label>
                <label>
                  <span>Master password</span>
                  <input
                    type="password"
                    name="master-password"
                    autoComplete="new-password"
                    placeholder="A different password, at least 12 characters"
                    minLength={12}
                    required
                  />
                </label>
                <label>
                  <span>Confirm master password</span>
                  <input
                    type="password"
                    name="master-password-confirmation"
                    autoComplete="new-password"
                    placeholder="Repeat your master password"
                    minLength={12}
                    required
                  />
                </label>
              </>
            ) : null}

            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
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
