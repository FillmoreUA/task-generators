(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  const TYPES = [
    ["plus", "x + a = b", "plus"],
    ["minus", "a − x = b", "minus"],
    ["mul", "x × a = b", "mul"],
    ["div", "x : a = b", "div"]
  ];

  App.generators.M10 = {
    buildForm(container, saved) {
      const opts = saved || {};
      const savedTypes = opts.types || ["plus", "minus", "mul", "div"];

      const typeWrap = ui.el("div", "field");
      typeWrap.appendChild(ui.el("label", null, t("form.equationTypes")));
      const typeRow = ui.el("div", "dir-row");
      const checks = {};
      TYPES.forEach(function (type) {
        const check = ui.checkbox(type[1], savedTypes.indexOf(type[0]) !== -1);
        check.label.classList.add("check-mini");
        checks[type[0]] = check;
        typeRow.appendChild(check.label);
      });
      typeWrap.appendChild(typeRow);
      container.appendChild(typeWrap);

      const range = App.math.range(container, t("form.solutionRange"), opts.min !== undefined ? opts.min : 1, opts.max !== undefined ? opts.max : 10, 1);
      const count = ui.numberInput(opts.count !== undefined ? opts.count : 12, 1, 32, 1);
      container.appendChild(ui.field(t("form.count"), count, t("form.countHint") + " 32."));

      readFields = function () {
        ui.clearErrors(container);
        const types = TYPES.map(function (type) {
          return type[0];
        }).filter(function (key) {
          return checks[key].input.checked;
        });
        if (!types.length) {
          ui.setError(typeRow, t("err.equationTypes"));
          return null;
        }
        const bounds = App.math.readRange(range, { min: 1 });
        if (!bounds) return null;
        const c = App.math.int(count);
        if (c === null || c < 1 || c > 32) {
          ui.setError(count, t("err.count") + " 32.");
          return null;
        }
        return { types, min: bounds.min, max: bounds.max, count: c };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const items = [];
      const seen = new Set();
      let guard = 0;

      while (items.length < opts.count && guard < opts.count * 300) {
        guard++;
        const type = rng.pick(opts.types);
        let x;
        let a;
        let b;
        let text;

        if (type === "minus") {
          x = rng.int(opts.min, opts.max);
          b = rng.int(opts.min, opts.max);
          a = x + b;
          text = a + " − x = " + b;
        } else if (type === "mul") {
          x = rng.int(opts.min, opts.max);
          a = rng.int(2, 9);
          b = x * a;
          text = "x × " + a + " = " + b;
        } else if (type === "div") {
          x = rng.int(opts.min, opts.max);
          a = rng.int(2, 9);
          b = x;
          text = (a * x) + " : " + a + " = " + b;
        } else {
          x = rng.int(opts.min, opts.max);
          a = rng.int(opts.min, opts.max);
          b = x + a;
          text = "x + " + a + " = " + b;
        }

        if (seen.has(text)) continue;
        seen.add(text);
        items.push({ text, expr: text, answer: "x = " + x });
      }

      return {
        body: App.math.tasks(items, true),
        answers: App.math.answers(items)
      };
    }
  };
})();
