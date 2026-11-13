(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  App.generators.M1 = {
    buildForm(container, saved) {
      const opts = saved || {};
      const common = App.math.buildCommon(container, opts, { maxCount: 32, defaultCount: 12 });
      const range = App.math.range(container, t("form.numberRange"), opts.min !== undefined ? opts.min : 1, opts.max !== undefined ? opts.max : 20, 1);

      readFields = function () {
        ui.clearErrors(container);
        const base = common.read();
        if (!base) return null;
        const bounds = App.math.readRange(range, { min: 0 });
        if (!bounds) return null;
        return Object.assign(base, { min: bounds.min, max: bounds.max });
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const items = [];
      const seen = new Set();
      let guard = 0;
      while (items.length < opts.count && guard < opts.count * 200) {
        guard++;
        const a = rng.int(opts.min, opts.max);
        const b = rng.int(opts.min, opts.max);
        const key = a + "+" + b;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ a, b, expr: a + " + " + b, answer: a + b });
      }
      const body =
        opts.format === "inline"
          ? App.math.inline(items, opts.numbering)
          : App.math.column(items, opts.numbering, "+");
      if (opts.grid) body.classList.add("grid-paper");
      return { body, answers: App.math.answers(items) };
    }
  };
})();
