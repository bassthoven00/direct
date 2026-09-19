/**
 * tests/unit/webhookIdempotency.test.ts
 *
 * Tests that the idempotency guard correctly handles duplicate webhooks.
 * AGENTS.md §3: Webhook handlers must be idempotent.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { acquireWebhookLock, markWebhookProcessed } from "@/lib/webhookIdempotency";

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhookEvent: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("acquireWebhookLock", () => {
  it("returns acquired=true on a new event", async () => {
    mockCreate.mockResolvedValue({ id: "evt-1" });

    const result = await acquireWebhookLock("stripe", "evt_123", "payment_intent.succeeded", {});

    expect(result.acquired).toBe(true);
    expect(result.webhookEventId).toBe("evt-1");
  });

  it("returns acquired=false on a duplicate event (P2002)", async () => {
    mockCreate.mockRejectedValue({ code: "P2002" });
    mockFindUnique.mockResolvedValue({ id: "evt-existing" });

    const result = await acquireWebhookLock("stripe", "evt_123", "payment_intent.succeeded", {});

    expect(result.acquired).toBe(false);
    expect(result.webhookEventId).toBe("evt-existing");
  });

  it("re-throws non-constraint errors", async () => {
    mockCreate.mockRejectedValue(new Error("Connection error"));

    await expect(
      acquireWebhookLock("stripe", "evt_123", "payment_intent.succeeded", {})
    ).rejects.toThrow("Connection error");
  });
});

describe("markWebhookProcessed", () => {
  it("updates processedAt on the event", async () => {
    mockUpdate.mockResolvedValue({});

    await markWebhookProcessed("evt-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "evt-1" },
      data: expect.objectContaining({ processedAt: expect.any(Date) }),
    });
  });
});
