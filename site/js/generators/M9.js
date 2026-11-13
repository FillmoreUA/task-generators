(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  let readFields = null;

  const PAIRS = {
    money: [["грн", "коп", 100]],
    time: [
      ["год", "хв", 60],
      ["хв", "с", 60],
      ["доба", "год", 24]
    ],
    length: [
      ["м", "см", 100],
      ["дм", "см", 10],
      ["см", "мм", 10],
      ["км", "м", 1000]
    ],
    mass: [
      ["кг", "г", 1000],
      ["т", "кг", 1000],
      ["ц", "кг", 100]
    ]
  };

  function sign(a, b) {
    return a > b ? ">" : a < b ? "<" : "=";
  }

  App.generators.M9 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const theme = ui.select(
        [
          ["money", t("m9.money")],
          ["time", t("m9.time")],
          ["length", t("m9.length")],
          ["mass", t("m9.mass")]
        ],
        opts.theme || "length"
      );
      container.appendChild(ui.field(t("form.unitTheme"), theme));

      const type = ui.select(
        [
          ["convert", t("m9.convert")],
          ["compare", t("m9.compare")],
          ["complete", t("m9.complete")]
        ],
        opts.type || "convert"
      );
      container.appendChild(ui.field(t("form.unitType"), type));

      const count = ui.numberInput(opts.count !== undefined ? opts.count : 12, 1, 32, 1);
      container.appendChild(ui.field(t("form.count"), count, t("form.countHint") + " 32."));

      readFields = function () {
        ui.clearErrors(container);
        const c = App.math.int(count);
        if (c === null || c < 1 || c > 32) {
          ui.setError(count, t("err.count") + " 32.");
          return null;
        }
        return { theme: theme.value, type: type.value, count: c };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const pairs = PAIRS[opts.theme] || PAIRS.length;      const items = [];
      const seen = new Set();
      let guard = 0;

      while (items.length < opts.count && guard < opts.count * 300) {
        guard++;
        const pair = rng.pick(pairs);
        const big = pair[0];
        const small = pair[1];
        const factor = pair[2];
        const maxValue = factor >= 1000 ? 4 : 9;
        const value = rng.int(1, maxValue);
        const converted = value * factor;
        let text;
        let answer;
        let expr;

        if (opts.type === "compare") {
          const other = rng.next() < 0.2 ? converted : Math.max(0, converted + rng.int(-Math.max(1, Math.floor(converted / 2)), Math.max(1, Math.floor(converted / 2))));
          text = value + " " + big + " ○ " + other + " " + small;
          answer = sign(converted, other);
          expr = text;
        } else if (opts.type === "complete") {
          if (rng.next() < 0.5) {
            text = "____ " + big + " = " + converted + " " + small;
            answer = String(value);
            expr = value + " " + big + " = " + converted + " " + small;
          } else {
            text = value + " " + big + " = " + converted + " ____";
            answer = small;
            expr = value + " " + big + " = " + converted + " " + small;
          }
        } else {
          text = value + " " + big + " = ____ " + small;
          answer = String(converted);
          expr = value + " " + big + " = " + converted + " " + small;
        }

        if (seen.has(text)) continue;
        seen.add(text);
        items.push({ text, expr, answer });
      }

      return {
        body: App.math.tasks(items, true),
        answers: App.math.answers(items)
      };
    }
  };
})();
