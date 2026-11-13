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

  App.generators.L9 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const language = ui.select(
        [
          ["UA", t("lang.ua")],
          ["PL", t("lang.pl")],
          ["EN", t("lang.en")]
        ],
        opts.language || "UA"
      );
      container.appendChild(ui.field(t("form.language"), language));

      const theme = ui.select([], "");
      container.appendChild(ui.field(t("form.theme"), theme));

      function fillThemes() {
        theme.innerHTML = "";
        const none = el("option", null, t("theme.none"));
        none.value = "";
        theme.appendChild(none);
        const sets = App.wordsets[language.value];
        if (!sets) return;
        sets.themes.forEach(function (set, index) {
          const option = el("option", null, set.name);
          option.value = String(index);
          theme.appendChild(option);
        });
        if (theme.children.length > 1) theme.value = "0";
      }
      fillThemes();
      language.addEventListener("change", fillThemes);

      const custom = el("textarea");
      custom.value = opts.custom || "";
      custom.placeholder = t("l9.customHint");
      container.appendChild(ui.field(t("l9.custom"), custom, t("l9.customHint")));

      const count = ui.numberInput(opts.count !== undefined ? opts.count : 5, 3, 10, 1);
      container.appendChild(ui.field(t("l9.wordCount"), count));

      const difficulty = ui.select(
        [
          ["0", t("difficulty.easy")],
          ["1", t("difficulty.medium")],
          ["2", t("difficulty.hard")]
        ],
        String(opts.difficulty !== undefined ? opts.difficulty : 1)
      );
      container.appendChild(ui.field(t("form.difficulty"), difficulty));

      readFields = function () {
        ui.clearErrors(container);
        const c = App.math.int(count);
        if (c === null || c < 3 || c > 10) {
          ui.setError(count, t("err.storyWords"));
          return null;
        }
        const customWords = parseWords(custom.value);
        const sets = App.wordsets[language.value];
        const themeSet = sets && theme.value !== "" ? sets.themes[parseInt(theme.value, 10)] : null;
        const source = customWords.length ? customWords : themeSet ? themeSet.words : [];
        if (source.length < c) {
          ui.setError(custom, t("err.storySource"));
          return null;
        }
        return {
          language: language.value,
          theme: theme.value,
          custom: custom.value,
          words: source,
          count: c,
          difficulty: parseInt(difficulty.value, 10)
        };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const words = rng.shuffle(opts.words).slice(0, opts.count);
      const lines = [4, 6, 8][opts.difficulty] || 6;

      const body = el("div", "story-body");
      body.appendChild(el("div", "story-task", t("l9.task")));
      const chips = el("div", "story-words");
      words.forEach(function (word) {
        chips.appendChild(el("span", "story-chip", word));
      });
      body.appendChild(chips);
      for (let i = 0; i < lines; i++) {
        body.appendChild(el("div", "write-line"));
      }

      return { body };
    }
  };
})();
