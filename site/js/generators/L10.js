(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  const SYLLABLES = [
    "ба", "бо", "бу", "бе", "би", "ва", "во", "ву", "ве", "ви",
    "га", "го", "гу", "ге", "ги", "да", "до", "ду", "де", "ди",
    "за", "зо", "зу", "зе", "зи", "ка", "ко", "ку", "ке", "ки",
    "ла", "ло", "лу", "ле", "ли", "ма", "мо", "му", "ме", "ми",
    "на", "но", "ну", "не", "ни", "па", "по", "пу", "пе", "пи",
    "ра", "ро", "ру", "ре", "ри", "са", "со", "су", "се", "си",
    "та", "то", "ту", "те", "ти", "фа", "фо", "фу", "фе", "фи"
  ];

  const WORDS = [
    "мама", "тато", "сонце", "школа", "книга", "ручка", "кіт", "пес", "дім",
    "сад", "ліс", "море", "річка", "небо", "квітка", "трава", "друг", "урок",
    "стіл", "вікно", "хліб", "молоко", "яблуко", "груша", "риба", "пташка",
    "дерево", "лисиця", "вовк", "ведмідь", "заєць", "мишка", "корова", "кінь"
  ];

  const PHRASES = [
    "діти йдуть до школи",
    "сонце світить ясно",
    "у саду ростуть квіти",
    "кіт спить на дивані",
    "мама читає книгу",
    "ми любимо природу",
    "тато ремонтує машину",
    "на небі сяють зорі",
    "восени опадає листя",
    "взимку падає сніг"
  ];

  function source(set, level) {
    if (set === "syllables") return SYLLABLES;
    if (set === "phrases") {
      if (level === 0) return PHRASES.filter(function (phrase) { return phrase.split(" ").length <= 4; });
      if (level === 1) return PHRASES.filter(function (phrase) { return phrase.split(" ").length <= 5; });
      return PHRASES;
    }
    if (level === 0) return WORDS.filter(function (word) { return word.length <= 4; });
    if (level === 1) return WORDS.filter(function (word) { return word.length <= 6; });
    return WORDS;
  }

  App.generators.L10 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const set = ui.select(
        [
          ["syllables", t("l10.syllables")],
          ["words", t("l10.words")],
          ["phrases", t("l10.phrases")]
        ],
        opts.set || "syllables"
      );
      container.appendChild(ui.field(t("l10.set"), set));

      const level = ui.select(
        [
          ["0", "1"],
          ["1", "2"],
          ["2", "3"]
        ],
        String(opts.level !== undefined ? opts.level : 0)
      );
      container.appendChild(ui.field(t("form.levelShort"), level));

      const columns = ui.numberInput(opts.columns !== undefined ? opts.columns : 3, 2, 4, 1);
      container.appendChild(ui.field(t("l10.columns"), columns));

      const size = ui.select(
        [
          ["normal", t("size.normal")],
          ["medium", t("size.medium")],
          ["large", t("size.large")]
        ],
        opts.size || "normal"
      );
      container.appendChild(ui.field(t("form.size"), size));

      const timer = ui.checkbox(t("l10.timer"), opts.timer !== false);
      container.appendChild(timer.label);

      readFields = function () {
        ui.clearErrors(container);
        const cols = App.math.int(columns);
        if (cols === null || cols < 2 || cols > 4) {
          ui.setError(columns, t("err.columns"));
          return null;
        }
        return {
          set: set.value,
          level: parseInt(level.value, 10),
          columns: cols,
          size: size.value,
          timer: timer.input.checked
        };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const items = source(opts.set, opts.level);
      const rows = opts.size === "large" ? 5 : opts.size === "medium" ? 7 : 10;
      const total = rows * opts.columns;
      const picked = [];
      let guard = 0;
      while (picked.length < total && guard < total * 200) {
        guard++;
        const item = rng.pick(items);
        if (picked.length && picked[picked.length - 1] === item && items.length > 1) continue;
        picked.push(item);
      }

      const body = el("div", "reading-body");
      if (opts.timer) {
        body.appendChild(el("div", "reading-timer", t("l10.timerLabel") + " ______"));
      }
      const table = el("div", "reading-table read-" + opts.size);
      table.style.setProperty("--cols", String(opts.columns));
      picked.forEach(function (item) {
        table.appendChild(el("div", "reading-cell", item));
      });
      body.appendChild(table);

      return { body };
    }
  };
})();
