import { afterEach, describe, expect, it, vi } from "vitest";

const originalSecret = process.env.ELEVENLABS_TOOL_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.ELEVENLABS_TOOL_SECRET;
  } else {
    process.env.ELEVENLABS_TOOL_SECRET = originalSecret;
  }
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("POST /api/agent/tools", () => {
  it("rejects missing configuration", async () => {
    delete process.env.ELEVENLABS_TOOL_SECRET;
    const { POST } = await import("@/app/api/agent/tools/route");

    const response = await POST(
      new Request("http://localhost/api/agent/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_case_context",
          analysisId: "analysis_x",
        }),
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "AGENT_TOOLS_NOT_CONFIGURED",
        message: "Agent tools are not configured on this server.",
      },
    });
  });

  it("rejects an invalid secret with a stable error body", async () => {
    process.env.ELEVENLABS_TOOL_SECRET = "test-secret-value-123456";
    const { POST } = await import("@/app/api/agent/tools/route");

    const response = await POST(
      new Request("http://localhost/api/agent/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Tool-Secret": "wrong-secret-value-123456",
        },
        body: JSON.stringify({
          action: "get_case_context",
          analysisId: "analysis_x",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHORIZED", message: "Invalid agent tool secret." },
    });
  });

  it("rejects malformed tool payloads after authentication", async () => {
    process.env.ELEVENLABS_TOOL_SECRET = "test-secret-value-123456";
    const { POST } = await import("@/app/api/agent/tools/route");

    const response = await POST(
      new Request("http://localhost/api/agent/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Agent-Tool-Secret": "test-secret-value-123456",
        },
        body: JSON.stringify({
          action: "delete_everything",
          analysisId: "analysis_x",
        }),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_TOOL_REQUEST",
        message: "Unsupported or invalid agent tool request.",
      },
    });
  });
});
