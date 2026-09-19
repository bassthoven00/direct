/**
 * tests/unit/transitions.test.ts
 *
 * Unit tests for all three state machine transition services.
 * AGENTS.md §3: State machine transitions are critical business logic — must be tested.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderStatus, PaymentStatus, ExperienceRequestStatus } from "@/types";
import {
  transitionOrderStatus,
  InvalidOrderTransitionError,
} from "@/services/transitions/orderTransitionService";
import {
  transitionPaymentStatus,
  InvalidPaymentTransitionError,
} from "@/services/transitions/paymentTransitionService";
import {
  transitionExperienceRequestStatus,
  InvalidExperienceTransitionError,
} from "@/services/transitions/experienceTransitionService";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const mockFindUniqueOrThrow = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        order:              { findUniqueOrThrow: mockFindUniqueOrThrow, update: mockUpdate },
        payment:            { findUniqueOrThrow: mockFindUniqueOrThrow, update: mockUpdate },
        experienceRequest:  { findUniqueOrThrow: mockFindUniqueOrThrow, update: mockUpdate },
        auditLog:           { create: mockCreate },
      });
    }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Order Transitions ────────────────────────────────────────────────────────

describe("transitionOrderStatus", () => {
  it("allows PENDING_PAYMENT → PAID", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: OrderStatus.PENDING_PAYMENT });
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
    
    await expect(transitionOrderStatus("order-1", OrderStatus.PAID)).resolves.not.toThrow();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("allows PAID → FULFILLED", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: OrderStatus.PAID });
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
    
    await expect(transitionOrderStatus("order-1", OrderStatus.FULFILLED)).resolves.not.toThrow();
  });

  it("rejects FULFILLED → PENDING_PAYMENT", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: OrderStatus.FULFILLED });
    
    await expect(
      transitionOrderStatus("order-1", OrderStatus.PENDING_PAYMENT)
    ).rejects.toThrow(InvalidOrderTransitionError);
  });

  it("rejects CANCELLED → PAID", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: OrderStatus.CANCELLED });
    
    await expect(
      transitionOrderStatus("order-1", OrderStatus.PAID)
    ).rejects.toThrow(InvalidOrderTransitionError);
  });

  it("rejects REFUNDED → any state", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: OrderStatus.REFUNDED });
    
    for (const target of [OrderStatus.PAID, OrderStatus.FULFILLED, OrderStatus.CANCELLED]) {
      await expect(
        transitionOrderStatus("order-1", target)
      ).rejects.toThrow(InvalidOrderTransitionError);
    }
  });
});

// ─── Payment Transitions ──────────────────────────────────────────────────────

describe("transitionPaymentStatus", () => {
  it("allows PENDING → SUCCESS", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: PaymentStatus.PENDING });
    mockUpdate.mockResolvedValue({});
    
    await expect(transitionPaymentStatus("pay-1", PaymentStatus.SUCCESS)).resolves.not.toThrow();
  });

  it("allows PENDING → FAILED", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: PaymentStatus.PENDING });
    mockUpdate.mockResolvedValue({});
    
    await expect(transitionPaymentStatus("pay-1", PaymentStatus.FAILED)).resolves.not.toThrow();
  });

  it("rejects FAILED → SUCCESS (no retry without new payment)", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: PaymentStatus.FAILED });
    
    await expect(
      transitionPaymentStatus("pay-1", PaymentStatus.SUCCESS)
    ).rejects.toThrow(InvalidPaymentTransitionError);
  });

  it("rejects SUCCESS → PENDING", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: PaymentStatus.SUCCESS });
    
    await expect(
      transitionPaymentStatus("pay-1", PaymentStatus.PENDING)
    ).rejects.toThrow(InvalidPaymentTransitionError);
  });
});

// ─── Experience Request Transitions ──────────────────────────────────────────

describe("transitionExperienceRequestStatus", () => {
  it("allows PENDING_PAYMENT → PENDING_REVIEW", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: ExperienceRequestStatus.PENDING_PAYMENT });
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
    
    await expect(
      transitionExperienceRequestStatus("exp-1", ExperienceRequestStatus.PENDING_REVIEW)
    ).resolves.not.toThrow();
  });

  it("allows IN_PROGRESS → DELIVERED", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: ExperienceRequestStatus.IN_PROGRESS });
    mockUpdate.mockResolvedValue({});
    mockCreate.mockResolvedValue({});
    
    await expect(
      transitionExperienceRequestStatus("exp-1", ExperienceRequestStatus.DELIVERED)
    ).resolves.not.toThrow();
  });

  it("rejects DELIVERED → ACCEPTED (backwards)", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: ExperienceRequestStatus.DELIVERED });
    
    await expect(
      transitionExperienceRequestStatus("exp-1", ExperienceRequestStatus.ACCEPTED)
    ).rejects.toThrow(InvalidExperienceTransitionError);
  });

  it("rejects REFUNDED → any state", async () => {
    mockFindUniqueOrThrow.mockResolvedValue({ status: ExperienceRequestStatus.REFUNDED });
    
    await expect(
      transitionExperienceRequestStatus("exp-1", ExperienceRequestStatus.PENDING_REVIEW)
    ).rejects.toThrow(InvalidExperienceTransitionError);
  });
});
