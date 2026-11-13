(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  function house(pairs, number, rng) {
    const body = el("div", "m5-house");
    body.appendChild(el("div", "m5-roof", String(number)));
    pairs.forEach(function (pair) {
      const row = el("div", "m5-floor");
      const a = el("div", "m5-cell", String(pair[0]));
      const b = el("div", "m5-cell", "____");
      if (rng.next() < 0.5) {
        a.textContent = "____";
        b.textContent = String(pair[1]);
      }
      row.append(a, b);
      body.appendChild(row);
    });
    return body;
  }

  App.generators.M5 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const number = ui.numberInput(opts.number !== undefined ? opts.number : 7, 2, 10, 1);
      container.appendChild(ui.field(t("form.number"), number));

      const mode = ui.select(
        [
          ["missing", t("m5.missing")],
          ["house", t("m5.house")]
        ],
        opts.mode || "missing"
      );
      container.appendChild(ui.field(t("form.m5Mode"), mode));

      const count = ui.numberInput(opts.count !== undefined ? opts.count : 8, 1, 24, 1);
      const countField = ui.field(t("form.count"), count, t("form.countHint") + " 24.");
      container.appendChild(countField);

      function syncMode() {
        countField.hidden = mode.value === "house";
      }
      mode.addEventListener("change", syncMode);
      syncMode();

      readFields = function () {
        ui.clearErrors(container);
        const n = App.math.int(number);
        if (n === null || n < 2 || n > 10) {
          ui.setError(number, t("err.number2_10"));
          return null;
        }
        if (mode.value === "house") {
          return { number: n, mode: mode.value, count: n + 1 };
        }
        const c = App.math.int(count);
        if (c === null || c < 1 || c > 24) {
          ui.setError(count, t("err.count") + " 24.");
          return null;
        }
        return { number: n, mode: mode.value, count: c };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const all = [];
      for (let a = 0; a <= opts.number; a++) all.push([a, opts.number - a]);
      const pairs =
        opts.mode === "house" ? all : rng.shuffle(all).slice(0, Math.min(opts.count, all.length));
      const items = pairs.map(function (pair) {
        const hideLeft = rng.next() < 0.5;
        return {
          text: hideLeft
            ? "____ + " + pair[1] + " = " + opts.number
            : pair[0] + " + ____ = " + opts.number,
          expr: pair[0] + " + " + pair[1] + " = " + opts.number,
          answer: String(hideLeft ? pair[0] : pair[1])
        };
      });

      if (opts.mode === "house") {
        return { body: house(pairs, opts.number, rng), answers: App.math.answers(items) };
      }
      return {
        body: App.math.tasks(items, true),
        answers: App.math.answers(items)
      };
    }
  };
})();
