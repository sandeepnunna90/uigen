// @vitest-environment node
import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { createSession, getSession, deleteSession, verifySession } from "../auth";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// --- createSession ---

test("createSession sets an HTTP-only cookie named auth-token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession sets a token that is a valid JWT string", async () => {
  await createSession("user-1", "test@example.com");

  const token: string = mockCookieStore.set.mock.calls[0][1];
  expect(token.split(".")).toHaveLength(3);
});

// --- getSession ---

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  await createSession("user-42", "alice@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];

  vi.clearAllMocks();
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-42");
  expect(session!.email).toBe("alice@example.com");
});

test("getSession returns null for a tampered token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "invalid.token.value" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode("development-secret-key");

  const expiredToken = await new SignJWT({ userId: "u1", email: "x@x.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("-1s")
    .sign(secret);

  mockCookieStore.get.mockReturnValue({ value: expiredToken });

  const session = await getSession();
  expect(session).toBeNull();
});

// --- deleteSession ---

test("deleteSession deletes the auth-token cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledOnce();
  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// --- verifySession ---

test("verifySession returns null when no cookie is present", async () => {
  const request = new NextRequest("http://localhost/");

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns session payload for a valid token", async () => {
  await createSession("user-99", "bob@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];

  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);
  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-99");
  expect(session!.email).toBe("bob@example.com");
});

test("verifySession returns null for an invalid token", async () => {
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: "auth-token=bad.token.here" },
  });

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns null for an expired token", async () => {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode("development-secret-key");

  const expiredToken = await new SignJWT({ userId: "u1", email: "x@x.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("-1s")
    .sign(secret);

  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${expiredToken}` },
  });

  const session = await verifySession(request);
  expect(session).toBeNull();
});
