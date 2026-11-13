(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  App.generators.M4 = {
    buildForm(container, saved) {
      const opts = saved || {};
      const common = App.math.buildCommon(container, opts, { maxCount: 32, defaultCount: 12 });

      const type = ui.select(
        [
          ["exact", t("div.exact")],
          ["remainder", t("div.remainder")]
        ],
        opts.type || "exact"
      );
      container.appendChild(ui.field(t("form.divisionType"), type));

      const divisor = App.math.range(container, t("form.divisorRange"), opts.divisorMin !== undefined ? opts.divisorMin : 2, opts.divisorMax !== undefined ? opts.divisorMax : 9, 1);
      const quotient = App.math.range(container, t("form.quotientRange"), opts.quotientMin !== undefined ? opts.quotientMin : 1, opts.quotientMax !== undefined ? opts.quotientMax : 10, 1);

      readFields = function () {
        ui.clearErrors(container);
        const base = common.read();
        if (!base) return null;
        const d = App.math.readRange(divisor, { min: 1 });
        if (!d) return null;
        const q = App.math.readRange(quotient, { min: 1 });
        if (!q) return null;
        return Object.assign(base, {
          type: type.value,
          divisorMin: d.min,
          divisorMax: d.max,
          quotientMin: q.min,
          quotientMax: q.max
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
        const b = rng.int(opts.divisorMin, opts.divisorMax);
        if (b < 1) continue;
        const q = rng.int(opts.quotientMin, opts.quotientMax);
        let a;
        let remainder = 0;
        if (opts.type === "remainder") {
          if (b < 2) continue;
          remainder = rng.int(1, b - 1);
          a = b * q + remainder;
        } else {
          a = b * q;
        }
        const key = a + ":" + b;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          a,
          b,
          remainder,
          expr: a + " : " + b,
          answer: remainder ? q + " (ост. " + remainder + ")" : String(q),
          extra: opts.type === "remainder" && opts.format === "inline" ? "(ост. ____)" : ""
        });
      }
      const body =
        opts.format === "inline"
          ? App.math.inline(items, opts.numbering)
          : App.math.division(items, opts.numbering);
      if (opts.grid) body.classList.add("grid-paper");
      return { body, answers: App.math.answers(items) };
    }
  };
})();
