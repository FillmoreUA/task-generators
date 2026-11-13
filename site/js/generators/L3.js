(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  function parseWords(text) {
    return text
      .split(/[\n,;]+/)
      .map(function (word) {
        return word.trim();
      })
      .filter(Boolean);
  }

  function scramble(word, keepFirst, rng) {
    const chars = word.split("");
    if (chars.length < 2) return word;
    let result = word;
    let attempts = 0;
    do {
      const head = keepFirst ? [chars[0]] : [];
      const tail = rng.shuffle(keepFirst ? chars.slice(1) : chars.slice());
      result = head.concat(tail).join("");
      attempts++;
    } while (result === word && attempts < 30);
    return result;
  }

  App.generators.L3 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const wordsInput = el("textarea");
      wordsInput.value =
        opts.words !== undefined ? opts.words : "кіт, сонце, школа, дерево";
      wordsInput.placeholder = t("form.wordsHint");
      container.appendChild(ui.field(t("form.words"), wordsInput, t("form.wordsHint")));

      const level = ui.select(
        [
          ["full", t("level.full")],
          ["keepFirst", t("level.keepFirst")]
        ],
        opts.level || "full"
      );
      container.appendChild(ui.field(t("form.level"), level));

      readFields = function () {
        ui.clearErrors(container);
        const words = parseWords(wordsInput.value);
        if (!words.length || words.some(function (word) { return word.length < 2; })) {
          ui.setError(wordsInput, t("err.words3"));
          return null;
        }
        if (words.length > 20) {
          ui.setError(wordsInput, t("err.wordsMax20"));
          return null;
        }
        return { words, level: level.value };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const items = opts.words.map(function (word) {
        const mixed = scramble(word, opts.level === "keepFirst", rng);
        return {
          expr: mixed.toUpperCase().split("").join(" "),
          answer: word.toUpperCase()
        };
      });

      const body = el("div", "anagram-grid");
      items.forEach(function (item, index) {
        const row = el("div", "anagram-item");
        row.appendChild(el("span", "math-index", index + 1 + ")"));
        row.appendChild(el("span", "anagram-letters", item.expr));
        row.appendChild(el("span", "inline-answer"));
        body.appendChild(row);
      });

      return { body, answers: App.math.answers(items) };
    }
  };
})();
