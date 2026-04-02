import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "@/app/main-content";

// Mock complex child components
vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Frame</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock resizable panels to just render children
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-group">{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
  ResizableHandle: () => <div data-testid="resizable-handle" />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MainContent toggle buttons", () => {
  test("shows preview view by default", () => {
    render(<MainContent />);

    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();
    expect(screen.queryByTestId("file-tree")).toBeNull();
  });

  test("toggles to code view when Code tab is clicked", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    expect(screen.queryByTestId("preview-frame")).toBeNull();
    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(screen.getByTestId("file-tree")).toBeDefined();
  });

  test("toggles back to preview view when Preview tab is clicked", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    // Switch to code
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.queryByTestId("preview-frame")).toBeNull();

    // Switch back to preview
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();
    expect(screen.queryByTestId("file-tree")).toBeNull();
  });

  test("Preview tab is active by default", () => {
    render(<MainContent />);

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const codeTab = screen.getByRole("tab", { name: "Code" });

    expect(previewTab.getAttribute("data-state")).toBe("active");
    expect(codeTab.getAttribute("data-state")).toBe("inactive");
  });

  test("Code tab becomes active after clicking it", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    const previewTab = screen.getByRole("tab", { name: "Preview" });
    const codeTab = screen.getByRole("tab", { name: "Code" });

    expect(codeTab.getAttribute("data-state")).toBe("active");
    expect(previewTab.getAttribute("data-state")).toBe("inactive");
  });

  test("can toggle between views multiple times", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    // Start: preview
    expect(screen.getByTestId("preview-frame")).toBeDefined();

    // Click Code
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeDefined();

    // Click Preview
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();

    // Click Code again
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeDefined();

    // Click Preview again
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
  });
});
