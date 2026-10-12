import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCart } from "../../hooks/useCart";
import MiniCartDrawer from "./MiniCartDrawer";

vi.mock("../../hooks/useCart", () => ({ useCart: vi.fn() }));

describe("MiniCartDrawer", () => {
  let container;
  let root;
  let closeMiniCart;
  let updateQuantity;
  let removeItem;
  let cartState;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    closeMiniCart = vi.fn();
    updateQuantity = vi.fn();
    removeItem = vi.fn();
    cartState = {
      items: [{
        id: "pan-1",
        slug: "pan",
        title: "Everyday Pan",
        image: "/products/p01.jpg",
        price: 20,
        quantity: 1,
        stock: 4,
      }],
      itemCount: 1,
      totals: { subtotal: 20 },
      isMiniCartOpen: true,
      closeMiniCart,
      updateQuantity,
      removeItem,
    };
    useCart.mockReturnValue(cartState);
    act(() => {
      root.render(createElement(MemoryRouter, null, createElement(MiniCartDrawer)));
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
    vi.clearAllMocks();
  });

  it("shows the cart total and available item controls", () => {
    expect(container.querySelector('[role="dialog"]').getAttribute("aria-modal")).toBe("true");
    expect(container.textContent).toContain("Your Cart");
    expect(container.textContent).toContain("₹20.00");
    expect(container.textContent).toContain("In Stock");

    act(() => container.querySelector('[aria-label="Increase Everyday Pan quantity"]').click());
    expect(updateQuantity).toHaveBeenCalledWith("pan-1", 2);

    act(() => container.querySelector('[aria-label="Remove Everyday Pan from cart"]').click());
    expect(removeItem).toHaveBeenCalledWith("pan-1", "Everyday Pan");
  });

  it("shows zero stock and blocks checkout for unavailable items", () => {
    useCart.mockReturnValue({
      ...cartState,
      items: [{ ...cartState.items[0], stock: 0 }],
    });
    act(() => {
      root.render(createElement(MemoryRouter, null, createElement(MiniCartDrawer)));
    });

    expect(container.textContent).toContain("Out of Stock");
    expect([...container.querySelectorAll("button[disabled]")]
      .some((button) => button.textContent.includes("Proceed to Checkout"))).toBe(true);
  });

  it("closes on Escape", () => {
    act(() => {
      container.querySelector('[role="dialog"]').dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
    });
    expect(closeMiniCart).toHaveBeenCalledTimes(1);
  });
});
