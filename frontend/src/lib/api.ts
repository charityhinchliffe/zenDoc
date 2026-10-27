import type { AccountSession } from "@/lib/session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AuthResult = {
  access_token: string;
  token_type: string;
  account: {
    id: number;
    email: string;
    full_name: string;
  };
};

export type VaultDocument = {
  id: number;
  name: string;
  kind: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  encrypted: boolean;
};

export type DocumentList = {
  documents: VaultDocument[];
  storage_used_bytes: number;
  storage_quota_bytes: number;
};

export type LibraryView = "all" | "recent" | "shared" | "trash";

export type ShareLink = {
  token: string;
  path: string;
  document_id: number;
};

type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  masterPassword: string;
};

export function sessionFromAuth(result: AuthResult): AccountSession {
  return {
    accessToken: result.access_token,
    id: result.account.id,
    email: result.account.email,
    fullName: result.account.full_name,
  };
}

export function signup(input: SignupInput) {
  return request<AuthResult>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      master_password: input.masterPassword,
    }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getAccount(token: string) {
  return request<AuthResult["account"]>("/auth/me", { method: "GET" }, token);
}

export function listDocuments(token: string, view: LibraryView) {
  return request<DocumentList>(`/documents?view=${view}`, { method: "GET" }, token);
}

export function uploadDocument(token: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<VaultDocument>("/documents", { method: "POST", body }, token);
}

export function downloadDocument(token: string, documentId: number, masterPassword: string) {
  return requestBlob(`/documents/${documentId}/download`, token, masterPassword);
}

export function shareDocument(token: string, documentId: number, masterPassword: string) {
  return request<ShareLink>(
    `/documents/${documentId}/share`,
    {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    },
    token,
  );
}

export function deleteDocument(token: string, documentId: number, masterPassword: string) {
  return request<VaultDocument>(
    `/documents/${documentId}/delete`,
    {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    },
    token,
  );
}

export function shareUrl(path: string) {
  return `${API_URL}${path}`;
}

async function request<T>(path: string, options: RequestInit, token?: string): Promise<T> {
  const response = await send(path, options, token);
  return (await response.json()) as T;
}

async function requestBlob(path: string, token: string, masterPassword: string) {
  const response = await send(
    path,
    {
      method: "POST",
      body: JSON.stringify({ master_password: masterPassword }),
    },
    token,
  );
  const blob = await response.blob();
  return {
    blob,
    filename: filenameFromDisposition(response.headers.get("content-disposition")),
  };
}

async function send(path: string, options: RequestInit, token?: string) {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Could not reach the zenDoc server.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response));
  }
  return response;
}

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      const messages = body.detail.map((item) => {
        if (typeof item === "object" && item && "msg" in item) return String(item.msg);
        return String(item);
      });
      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    return "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}

function filenameFromDisposition(header: string | null) {
  if (!header) return "download";
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = header.match(/filename="?([^"]+)"?/i);
  return plain?.[1] ?? "download";
}
