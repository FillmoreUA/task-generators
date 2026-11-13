(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  function sign(a, b) {
    return a > b ? ">" : a < b ? "<" : "=";
  }

  App.generators.M8 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const mode = ui.select(
        [
          ["numbers", t("m8.numbers")],
          ["expressions", t("m8.expressions")]
        ],
        opts.mode || "numbers"
      );
      container.appendChild(ui.field(t("form.compareMode"), mode));

      const range = App.math.range(container, t("form.numberRange"), opts.min !== undefined ? opts.min : 1, opts.max !== undefined ? opts.max : 20, 1);
      const count = ui.numberInput(opts.count !== undefined ? opts.count : 12, 1, 32, 1);
      container.appendChild(ui.field(t("form.count"), count, t("form.countHint") + " 32."));

      readFields = function () {
        ui.clearErrors(container);
        const bounds = App.math.readRange(range, { min: 0 });
        if (!bounds) return null;
        const c = App.math.int(count);
        if (c === null || c < 1 || c > 32) {
          ui.setError(count, t("err.count") + " 32.");
          return null;
        }
        return { mode: mode.value, min: bounds.min, max: bounds.max, count: c };
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
        let text;
        let answer;
        if (opts.mode === "expressions") {
          const a = rng.int(opts.min, opts.max);
          const b = rng.int(opts.min, opts.max);
          const c = rng.int(opts.min, opts.max);
          const d = rng.int(opts.min, opts.max);
          text = a + " + " + b + " ○ " + c + " + " + d;
          answer = sign(a + b, c + d);
        } else {
          const a = rng.int(opts.min, opts.max);
          const b = rng.int(opts.min, opts.max);
          text = a + " ○ " + b;
          answer = sign(a, b);
        }
        if (seen.has(text)) continue;
        seen.add(text);
        items.push({ text, expr: text, answer });
      }

      return {
        body: App.math.tasks(items, true),
        answers: App.math.answers(items)
      };
    }
  };
})();
