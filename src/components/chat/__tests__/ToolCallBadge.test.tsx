import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor commands ---

test("shows 'Creating <filename>' for str_replace_editor create", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Card.jsx" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/App.jsx" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "/utils/helpers.ts" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("shows 'Viewing <filename>' for str_replace_editor view", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/index.ts" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Viewing index.ts")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for str_replace_editor undo_edit", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "5",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "/foo.js" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Undoing edit in foo.js")).toBeDefined();
});

// --- file_manager commands ---

test("shows 'Renaming <filename>' for file_manager rename", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "6",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.js", new_path: "/new.js" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Renaming old.js")).toBeDefined();
});

test("shows 'Deleting <filename>' for file_manager delete", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "7",
    toolName: "file_manager",
    args: { command: "delete", path: "/src/Unused.tsx" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// --- Filename extraction ---

test("extracts filename from deeply nested path", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "8",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/very/nested/path/Component.tsx" },
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("Creating Component.tsx")).toBeDefined();
});

// --- Fallback behavior ---

test("falls back to tool name for unknown tool", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "9",
    toolName: "some_other_tool",
    args: {},
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("some_other_tool")).toBeDefined();
});

test("falls back to tool name when args has no path", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "10",
    toolName: "str_replace_editor",
    args: {},
  };
  render(<ToolCallBadge toolInvocation={tool} />);
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

// --- In-progress vs completed state ---

test("shows spinner when state is 'call'", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "11",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  };
  const { container } = render(<ToolCallBadge toolInvocation={tool} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is 'partial-call'", () => {
  const tool: ToolInvocation = {
    state: "partial-call",
    toolCallId: "12",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  };
  const { container } = render(<ToolCallBadge toolInvocation={tool} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is 'result' with truthy result", () => {
  const tool: ToolInvocation = {
    state: "result",
    toolCallId: "13",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    result: "Success",
  };
  const { container } = render(<ToolCallBadge toolInvocation={tool} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is 'result' but result is falsy", () => {
  const tool: ToolInvocation = {
    state: "result",
    toolCallId: "14",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    result: null,
  };
  const { container } = render(<ToolCallBadge toolInvocation={tool} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
