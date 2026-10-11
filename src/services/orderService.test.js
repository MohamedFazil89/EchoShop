import { afterEach, describe, expect, it, vi } from "vitest";
import { placeOrder } from "./orderService";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("placeOrder", () => {
  it("sends an idempotency key and only order/customer data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ order: { id: "ORD-test" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await placeOrder({
      items: [{ id: "product-1", quantity: 2, price: 10 }],
      customer: { name: "Test Buyer", email: "buyer@example.com" },
      idempotencyKey: "e4053f2f-5cf8-4a4f-b290-2445987bd0c3",
    });

    const [path, options] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/orders");
    expect(options.headers["Idempotency-Key"]).toBe("e4053f2f-5cf8-4a4f-b290-2445987bd0c3");
    expect(JSON.parse(options.body)).toEqual({
      items: [{ id: "product-1", quantity: 2 }],
      customer: { name: "Test Buyer", email: "buyer@example.com" },
    });
  });
});
