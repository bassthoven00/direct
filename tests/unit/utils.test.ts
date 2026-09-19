/**
 * tests/unit/utils.test.ts — T-007 example test (Phase 1 acceptance criterion)
 */

import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  generateOrderNumber,
  slugify,
  toMinorUnits,
  fromMinorUnits,
} from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats cents as USD by default", () => {
    expect(formatCurrency(1499)).toBe("$14.99");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts", () => {
    expect(formatCurrency(100000)).toBe("$1,000.00");
  });
});

describe("generateOrderNumber", () => {
  it("matches the DIR-YYYYMMDD-XXXX format", () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^DIR-\d{8}-[A-Z0-9]{4}$/);
  });

  it("generates unique numbers on successive calls", () => {
    const nums = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(nums.size).toBeGreaterThan(1);
  });
});

describe("slugify", () => {
  it("converts text to slug", () => {
    expect(slugify("My Product Name")).toBe("my-product-name");
  });

  it("handles special characters", () => {
    expect(slugify("Shout-Out (Birthday Edition)!")).toBe("shout-out-birthday-edition");
  });

  it("handles leading/trailing spaces", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });
});

describe("toMinorUnits / fromMinorUnits", () => {
  it("converts dollars to cents correctly", () => {
    expect(toMinorUnits(14.99)).toBe(1499);
  });

  it("converts cents back to dollars", () => {
    expect(fromMinorUnits(1499)).toBe(14.99);
  });

  it("round-trips correctly", () => {
    expect(fromMinorUnits(toMinorUnits(25.5))).toBe(25.5);
  });
});
