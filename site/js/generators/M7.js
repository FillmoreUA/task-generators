(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  function pyramid(base) {
    const rows = [base.slice()];
    while (rows[rows.length - 1].length > 1) {
      const prev = rows[rows.length - 1];
      const next = [];
      for (let i = 0; i < prev.length - 1; i++) next.push(prev[i] + prev[i + 1]);
      rows.push(next);
    }
    return rows;
  }

  function renderPyramid(rows, hidden) {
    const body = el("div", "pyramid");
    for (let r = rows.length - 1; r >= 0; r--) {
      const line = el("div", "pyr-row");
      rows[r].forEach(function (value, c) {
        const key = r + ":" + c;
        line.appendChild(el("div", "pyr-cell", hidden.has(key) ? "" : String(value)));
      });
      body.appendChild(line);
    }
    return body;
  }

  App.generators.M7 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const height = ui.select(
        [
          ["3", "3"],
          ["4", "4"],
          ["5", "5"]
        ],
        String(opts.height || 4)
      );
      container.appendChild(ui.field(t("form.height"), height));

      const range = App.math.range(container, t("form.baseNumbers"), opts.min !== undefined ? opts.min : 1, opts.max !== undefined ? opts.max : 9, 1);
      const hints = ui.numberInput(opts.hints !== undefined ? opts.hints : 0, 0, 10, 1);
      container.appendChild(ui.field(t("form.hints"), hints));

      readFields = function () {
        ui.clearErrors(container);
        const bounds = App.math.readRange(range, { min: 0 });
        if (!bounds) return null;
        const h = App.math.int(hints);
        if (h === null || h < 0 || h > 10) {
          ui.setError(hints, t("err.hints"));
          return null;
        }
        return { height: parseInt(height.value, 10), min: bounds.min, max: bounds.max, hints: h };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const base = [];
      for (let i = 0; i < opts.height; i++) base.push(rng.int(opts.min, opts.max));
      const rows = pyramid(base);

      const candidates = [];
      for (let r = 1; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) candidates.push(r + ":" + c);
      }
      const shown = rng.shuffle(candidates).slice(0, Math.min(opts.hints, candidates.length));
      const visible = new Set(shown);
      const hidden = new Set(
        candidates.filter(function (key) {
          return !visible.has(key);
        })
      );

      const body = el("div", "pyramid-wrap");
      body.appendChild(renderPyramid(rows, hidden));
      const answers = el("div", "pyramid-wrap");
      answers.appendChild(renderPyramid(rows, new Set()));

      return { body, answers };
    }
  };
})();
