(function () {
  const App = (window.App = window.App || {});
  let uid = 0;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function nextId(prefix) {
    return "f-" + (prefix || "x") + "-" + ++uid;
  }

  function field(labelText, input, hintText) {
    const wrap = el("div", "field");
    const label = el("label", null, labelText);
    if (!input.id) input.id = nextId("input");
    label.htmlFor = input.id;
    wrap.append(label, input);
    if (hintText) wrap.appendChild(el("div", "hint", hintText));
    return wrap;
  }

  function numberInput(value, min, max, step) {
    const input = el("input");
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step || 1);
    input.value = value;
    return input;
  }

  function select(options, value) {
    const node = el("select");
    options.forEach(function (pair) {
      const option = el("option", null, pair[1]);
      option.value = pair[0];
      node.appendChild(option);
    });
    node.value = value;
    return node;
  }

  function checkbox(labelText, checked) {
    const label = el("label", "check");
    const input = el("input");
    input.type = "checkbox";
    input.checked = !!checked;
    label.append(input, el("span", null, labelText));
    return { label, input };
  }

  function setError(input, message) {
    input.classList.add("invalid");
    const fieldNode = input.closest(".field") || input.parentElement;
    let error = fieldNode.querySelector(".field-error");
    if (!error) {
      error = el("div", "field-error");
      fieldNode.appendChild(error);
    }
    error.textContent = message;
  }

  function clearErrors(root) {
    if (!root) return;
    root.querySelectorAll(".field-error").forEach(function (node) {
      node.remove();
    });
    root.querySelectorAll(".invalid").forEach(function (node) {
      node.classList.remove("invalid");
    });
  }

  App.ui = {
    el,
    field,
    numberInput,
    select,
    checkbox,
    setError,
    clearErrors
  };
})();
