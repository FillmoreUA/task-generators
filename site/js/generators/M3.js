(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  App.generators.M3 = {
    buildForm(container, saved) {
      const opts = saved || {};
      const common = App.math.buildCommon(container, opts, { maxCount: 32, defaultCount: 12 });

      const table = ui.select(
        [["all", t("table.all")]].concat(
          [2, 3, 4, 5, 6, 7, 8, 9].map(function (n) {
            return [String(n), String(n)];
          })
        ),
        opts.table || "all"
      );
      container.appendChild(ui.field(t("form.table"), table));

      const range = App.math.range(container, t("form.factorRange"), opts.factorMin !== undefined ? opts.factorMin : 1, opts.factorMax !== undefined ? opts.factorMax : 10, 1);
      const multidigit = ui.checkbox(t("form.multidigit"), !!opts.multidigit);
      container.appendChild(multidigit.label);

      readFields = function () {
        ui.clearErrors(container);
        const base = common.read();
        if (!base) return null;
        const bounds = App.math.readRange(range, { min: 0 });
        if (!bounds) return null;
        return Object.assign(base, {
          table: table.value,
          factorMin: bounds.min,
          factorMax: bounds.max,
          multidigit: multidigit.input.checked
        });
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
        const a = opts.multidigit
          ? rng.int(11, 99)
          : opts.table === "all"
            ? rng.int(2, 9)
            : parseInt(opts.table, 10);
        const b = rng.int(opts.factorMin, opts.factorMax);
        const key = a + "x" + b;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ a, b, expr: a + " × " + b, answer: a * b });
      }
      const body =
        opts.format === "inline"
          ? App.math.inline(items, opts.numbering)
          : App.math.column(items, opts.numbering, "×");
      if (opts.grid) body.classList.add("grid-paper");
      return { body, answers: App.math.answers(items) };
    }
  };
})();
