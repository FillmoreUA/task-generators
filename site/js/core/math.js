(function () {
  const App = (window.App = window.App || {});
  const el = App.ui.el;
  const t = App.i18n.t.bind(App.i18n);

  function int(input) {
    const value = parseInt(input.value, 10);
    return isFinite(value) ? value : null;
  }

  function buildCommon(container, saved, config) {
    const cfg = Object.assign({ maxCount: 32, defaultCount: 12 }, config || {});
    const savedOpts = saved || {};

    const format = App.ui.select(
      [
        ["column", t("format.column")],
        ["inline", t("format.inline")]
      ],
      savedOpts.format || "column"
    );
    container.appendChild(App.ui.field(t("form.format"), format));

    const count = App.ui.numberInput(
      savedOpts.count !== undefined ? savedOpts.count : cfg.defaultCount,
      1,
      cfg.maxCount,
      1
    );
    container.appendChild(
      App.ui.field(t("form.count"), count, t("form.countHint") + " " + cfg.maxCount + ".")
    );

    const numbering = App.ui.checkbox(t("form.numbering"), savedOpts.numbering !== false);
    const grid = App.ui.checkbox(t("form.grid"), !!savedOpts.grid);
    container.append(numbering.label, grid.label);

    return {
      read() {
        const number = int(count);
        if (number === null || number < 1 || number > cfg.maxCount) {
          App.ui.setError(count, t("err.count") + " " + cfg.maxCount + ".");
          return null;
        }
        return {
          format: format.value,
          count: number,
          numbering: numbering.input.checked,
          grid: grid.input.checked
        };
      }
    };
  }

  function range(container, labelText, minValue, maxValue, step) {
    const wrap = el("div", "field");
    wrap.appendChild(el("label", null, labelText));
    const row = el("div", "range-row");

    const minInput = App.ui.numberInput(minValue, -1000000, 1000000, step || 1);
    const maxInput = App.ui.numberInput(maxValue, -1000000, 1000000, step || 1);
    minInput.id = minInput.id || "range-min";
    maxInput.id = maxInput.id || "range-max";

    const minWrap = el("div", "mini");
    minWrap.append(el("span", null, t("form.from")), minInput);
    const maxWrap = el("div", "mini");
    maxWrap.append(el("span", null, t("form.to")), maxInput);

    row.append(minWrap, maxWrap);
    wrap.appendChild(row);
    container.appendChild(wrap);
    return { minInput, maxInput };
  }

  function readRange(field, options) {
    const cfg = Object.assign({ min: 0, allowEqual: true }, options || {});
    const min = int(field.minInput);
    const max = int(field.maxInput);
    if (min === null || max === null) {
      App.ui.setError(field.minInput, t("err.integer"));
      return null;
    }
    if (min > max) {
      App.ui.setError(field.minInput, t("err.minMax"));
      return null;
    }
    if (min < cfg.min) {
      App.ui.setError(field.minInput, t("err.minValue") + " " + cfg.min + ".");
      return null;
    }
    if (!cfg.allowEqual && min === max) {
      App.ui.setError(field.minInput, t("err.needsRange"));
      return null;
    }
    return { min, max };
  }

  function inline(items, numbering) {
    const body = el("div", "math-body math-inline");
    items.forEach(function (item, index) {
      const cell = el("div", "math-inline-item");
      if (numbering) cell.appendChild(el("span", "math-index", index + 1 + ")"));
      cell.appendChild(el("span", "math-expr", item.expr));
      cell.appendChild(el("span", "math-eq", "="));
      cell.appendChild(el("span", "inline-answer"));
      if (item.extra) cell.appendChild(el("span", "math-extra", item.extra));
      body.appendChild(cell);
    });
    return body;
  }

  function row(sign, value, className) {
    const line = el("div", "row" + (className ? " " + className : ""));
    line.appendChild(el("span", "sign", sign));
    line.appendChild(el("span", "val", value));
    return line;
  }

  function column(items, numbering, sign) {
    const body = el("div", "math-body math-columns");
    items.forEach(function (item, index) {
      const cell = el("div", "math-col");
      if (numbering) cell.appendChild(el("span", "math-index", index + 1 + ")"));
      const stack = el("div", "stack");
      stack.appendChild(row(sign, item.a));
      stack.appendChild(row("", item.b));
      stack.appendChild(el("div", "rule"));
      stack.appendChild(row("", "", "answer"));
      cell.appendChild(stack);
      body.appendChild(cell);
    });
    return body;
  }

  function division(items, numbering) {
    const body = el("div", "math-body math-columns");
    items.forEach(function (item, index) {
      const cell = el("div", "math-col");
      if (numbering) cell.appendChild(el("span", "math-index", index + 1 + ")"));
      const corner = el("div", "div-corner");
      corner.appendChild(el("div", "div-dividend", String(item.a)));
      const right = el("div", "div-right");
      right.appendChild(el("div", "div-divisor", String(item.b)));
      right.appendChild(el("div", "div-line"));
      right.appendChild(el("div", "div-quotient"));
      corner.appendChild(right);
      cell.appendChild(corner);
      body.appendChild(cell);
    });
    return body;
  }

  function answers(items) {
    const body = el("div", "math-body answers-grid");
    items.forEach(function (item, index) {
      body.appendChild(el("div", "answer-row", index + 1 + ") " + item.expr + " = " + item.answer));
    });
    return body;
  }

  function tasks(items, numbering, className) {
    const body = el("div", "math-body fill-grid" + (className ? " " + className : ""));
    items.forEach(function (item, index) {
      const cell = el("div", "fill-item");
      if (numbering) cell.appendChild(el("span", "math-index", index + 1 + ")"));
      cell.appendChild(el("span", "fill-text", item.text));
      body.appendChild(cell);
    });
    return body;
  }

  App.math = {
    int,
    buildCommon,
    range,
    readRange,
    inline,
    column,
    division,
    answers,
    tasks
  };
})();
