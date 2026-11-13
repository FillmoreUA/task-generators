(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  function equations(a, b, c, type) {
    if (type === "mul") {
      return [
        a + " × " + b + " = " + c,
        b + " × " + a + " = " + c,
        c + " : " + a + " = " + b,
        c + " : " + b + " = " + a
      ];
    }
    return [
      a + " + " + b + " = " + c,
      b + " + " + a + " = " + c,
      c + " − " + a + " = " + b,
      c + " − " + b + " = " + a
    ];
  }

  App.generators.M6 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const type = ui.select(
        [
          ["add", t("m6.add")],
          ["mul", t("m6.mul")]
        ],
        opts.type || "add"
      );
      container.appendChild(ui.field(t("form.m6Type"), type));

      const range = App.math.range(container, t("form.operands"), opts.min !== undefined ? opts.min : 2, opts.max !== undefined ? opts.max : 9, 1);

      const count = ui.numberInput(opts.count !== undefined ? opts.count : 6, 1, 10, 1);
      container.appendChild(ui.field(t("form.count"), count, t("form.countHint") + " 10."));

      readFields = function () {
        ui.clearErrors(container);
        const bounds = App.math.readRange(range, { min: 1 });
        if (!bounds) return null;
        const c = App.math.int(count);
        if (c === null || c < 1 || c > 10) {
          ui.setError(count, t("err.count") + " 10.");
          return null;
        }
        return { type: type.value, min: bounds.min, max: bounds.max, count: c };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const groups = [];
      const seen = new Set();
      let guard = 0;
      while (groups.length < opts.count && guard < opts.count * 300) {
        guard++;
        const a = rng.int(opts.min, opts.max);
        const b = rng.int(opts.min, opts.max);
        const key = opts.type === "mul" ? [a, b].sort().join("x") : [a, b].sort().join("+");
        if (seen.has(key)) continue;
        seen.add(key);
        const c = opts.type === "mul" ? a * b : a + b;
        groups.push({ nums: [a, b, c], eqs: equations(a, b, c, opts.type) });
      }

      const body = el("div", "link-grid");
      groups.forEach(function (group, index) {
        const card = el("div", "link-card");
        card.appendChild(el("div", "link-title", index + 1 + ") " + group.nums.join(", ")));
        for (let i = 0; i < 4; i++) {
          card.appendChild(el("div", "link-line", "_______"));
        }
        body.appendChild(card);
      });

      const answers = el("div", "link-answers");
      groups.forEach(function (group, index) {
        const block = el("div", "link-answer");
        block.appendChild(el("div", "answer-title", index + 1 + ") " + group.nums.join(", ")));
        group.eqs.forEach(function (equation) {
          block.appendChild(el("div", "answer-eq", equation));
        });
        answers.appendChild(block);
      });

      return { body, answers };
    }
  };
})();
