import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { CardNumberInput } from "./CardNumberInput";

function ControlledInput({ onChange }) {
  const [value, setValue] = useState("");
  return createElement(CardNumberInput, {
    value,
    onChange: (nextValue) => {
      onChange(nextValue);
      setValue(nextValue);
    },
  });
}

describe("CardNumberInput", () => {
  let container;
  let root;
  let onChange;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    onChange = vi.fn();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    act(() => {
      root.render(createElement(ControlledInput, { onChange }));
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  function inputValue(value, caret = value.length) {
    const input = container.querySelector("#card-number");
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    ).set;
    act(() => {
      setValue.call(input, value);
      input.setSelectionRange(caret, caret);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return input;
  }

  test("formats while typing without moving the caret out of the insertion point", () => {
    let input = inputValue("424242", 4);
    expect(input.value).toBe("4242 42");
    expect(input.selectionStart).toBe(5);

    input = inputValue(`${input.value.slice(0, input.selectionStart)}9${input.value.slice(input.selectionEnd)}`, 6);
    expect(input.value).toBe("4242 942");
    expect(input.selectionStart).toBe(6);
    expect(onChange).toHaveBeenLastCalledWith("4242 942");
  });

  test("filters non-digits and refuses input beyond the detected brand length", () => {
    const input = inputValue("378282246310005x999");
    expect(input.value).toBe("3782 822463 10005");
    expect(input.maxLength).toBe(17);
    expect(onChange).toHaveBeenLastCalledWith("3782 822463 10005");

    inputValue(`${input.value}9`);
    expect(input.value).toBe("3782 822463 10005");
  });

  test("backspace beside a grouping space removes the previous digit", () => {
    const input = inputValue("4242424242424242");
    input.setSelectionRange(5, 5);
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));
    });

    expect(input.value).toBe("4244 2424 2424 242");
    expect(input.selectionStart).toBe(3);
  });

  test("pasting replaces only the selected characters", () => {
    const input = inputValue("4242424242424242");
    input.setSelectionRange(5, 9);
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", {
      value: { getData: () => "5555" },
    });

    act(() => input.dispatchEvent(paste));

    expect(input.value).toBe("4242 5555 4242 4242");
    expect(input.selectionStart).toBe(10);
    expect(onChange).toHaveBeenLastCalledWith("4242 5555 4242 4242");
  });
});
