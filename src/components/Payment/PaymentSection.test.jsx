import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { PaymentSection } from "./PaymentSection";

describe("PaymentSection checkout validation", () => {
  let container;
  let root;
  let paymentValidationRef;
  let placeOrder;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    paymentValidationRef = { current: null };
    placeOrder = vi.fn();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    act(() => {
      root.render(
        createElement(
          "form",
          {
            noValidate: true,
            onSubmit: (event) => {
              event.preventDefault();
              if (!paymentValidationRef.current?.()) return;
              if (!event.currentTarget.reportValidity()) return;
              placeOrder();
            },
          },
          createElement("input", { id: "contact-email", type: "email", required: true }),
          createElement(PaymentSection, { validationRef: paymentValidationRef }),
          createElement("button", { type: "submit" }, "Place order")
        )
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  function submit() {
    act(() => container.querySelector('button[type="submit"]').click());
  }

  function enterValue(id, value) {
    const input = container.querySelector(`#${id}`);
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    ).set;
    act(() => {
      setValue.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  test("blocks empty card fields, shows field errors, and focuses the first invalid field", () => {
    submit();

    expect(placeOrder).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(3);
    expect(document.activeElement.id).toBe("card-number");
  });

  test("revalidates current values, respects other required fields, and submits no card data", () => {
    enterValue("card-number", "4242-4242-4242-4242");
    enterValue("card-expiry", "12/30");
    enterValue("card-cvc", "123");

    submit();
    expect(placeOrder).not.toHaveBeenCalled();
    expect(container.querySelector("#contact-email").validity.valueMissing).toBe(true);

    enterValue("contact-email", "buyer@example.test");
    submit();
    expect(placeOrder).toHaveBeenCalledTimes(1);

    const formData = new FormData(container.querySelector("form"));
    expect([...formData.entries()]).toEqual([]);
  });

  test("blocks a card number with an invalid checksum at submit time", () => {
    enterValue("card-number", "4242-4242-4242-4241");
    enterValue("card-expiry", "12/30");
    enterValue("card-cvc", "123");
    enterValue("contact-email", "buyer@example.test");

    submit();

    expect(placeOrder).not.toHaveBeenCalled();
    expect(container.querySelector("#card-number-error").textContent)
      .toBe("Card number checksum is invalid");
    expect(document.activeElement.id).toBe("card-number");
  });

  test("filters non-digits and caps each payment field at its supported length", () => {
    enterValue("card-number", "5555-5555-5555-4444x999");
    enterValue("card-expiry", "12/2030abc99");
    enterValue("card-cvc", "123abc456");

    expect(container.querySelector("#card-number").value).toBe("5555 5555 5555 4444");
    expect(container.querySelector("#card-expiry").value).toBe("12 / 2030");
    expect(container.querySelector("#card-cvc").value).toBe("123");

    enterValue("card-number", "378282246310005");
    expect(container.querySelector("#card-cvc").maxLength).toBe(4);
  });
});
