(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  const EMOJI = {
    "кіт": "🐱", "собака": "🐶", "пес": "🐶", "сонце": "☀️", "місяць": "🌙",
    "зірка": "⭐", "яблуко": "🍎", "груша": "🍐", "банан": "🍌", "полуниця": "🍓",
    "морква": "🥕", "картопля": "🥔", "хліб": "🍞", "молоко": "🥛", "сир": "🧀",
    "риба": "🐟", "квітка": "🌸", "дерево": "🌳", "лист": "🍃", "трава": "🌿",
    "вода": "💧", "море": "🌊", "річка": "🏞️", "гора": "⛰️", "ліс": "🌲",
    "дім": "🏠", "школа": "🏫", "книга": "📚", "олівець": "✏️", "ручка": "🖊️",
    "зошит": "📓", "м'яч": "⚽", "машина": "🚗", "автобус": "🚌", "літак": "✈️",
    "корабель": "🚢", "велосипед": "🚲", "годинник": "⌚", "телефон": "📱",
    "комп'ютер": "💻", "музика": "🎵", "серце": "❤️", "дощ": "🌧️", "сніг": "❄️",
    "вітер": "💨", "вогонь": "🔥", "яйце": "🥚", "торт": "🍰", "чай": "🍵",
    "кава": "☕", "виноград": "🍇", "апельсин": "🍊", "лимон": "🍋", "помідор": "🍅",
    "огірок": "🥒", "гриб": "🍄", "жаба": "🐸", "пташка": "🐦", "кінь": "🐴",
    "корова": "🐮", "свиня": "🐷", "вівця": "🐑", "мишка": "🐭", "заєць": "🐰",
    "лисиця": "🦊", "вовк": "🐺", "ведмідь": "🐻", "лев": "🦁", "тигр": "🐯",
    "мавпа": "🐵", "слон": "🐘", "черепаха": "🐢", "змія": "🐍", "бджола": "🐝",
    "метелик": "🦋", "павук": "🕷️", "парасолька": "☂️", "ключ": "🔑", "двері": "🚪",
    "стіл": "🪑", "ліжко": "🛏️", "чашка": "☕", "ложка": "🥄", "виделка": "🍴",
    "cat": "🐱", "dog": "🐶", "sun": "☀️", "moon": "🌙", "star": "⭐",
    "apple": "🍎", "pear": "🍐", "banana": "🍌", "strawberry": "🍓", "carrot": "🥕",
    "bread": "🍞", "milk": "🥛", "cheese": "🧀", "fish": "🐟", "flower": "🌸",
    "tree": "🌳", "leaf": "🍃", "grass": "🌿", "water": "💧", "sea": "🌊",
    "mountain": "⛰️", "forest": "🌲", "house": "🏠", "school": "🏫", "book": "📚",
    "pencil": "✏️", "ball": "⚽", "car": "🚗", "bus": "🚌", "plane": "✈️",
    "ship": "🚢", "bike": "🚲", "clock": "⌚", "phone": "📱", "computer": "💻",
    "music": "🎵", "heart": "❤️", "rain": "🌧️", "snow": "❄️", "wind": "💨",
    "fire": "🔥", "egg": "🥚", "cake": "🍰", "coffee": "☕", "grapes": "🍇"
  };

  const FALLBACK = ["🖼️", "🎁", "🎈", "🧩", "🎨", "🌈", "🍀", "🔔", "🧸", "🎯"];

  function parseWords(text) {
    return text
      .split(/[\n,;]+/)
      .map(function (word) {
        return word.trim();
      })
      .filter(Boolean);
  }

  App.generators.L8 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const wordsInput = el("textarea");
      wordsInput.value =
        opts.words !== undefined
          ? opts.words
          : "кіт, собака, сонце, яблуко, риба, квітка";
      container.appendChild(ui.field(t("form.words"), wordsInput, t("l8.hint")));

      const pairs = ui.numberInput(opts.pairs !== undefined ? opts.pairs : 6, 3, 8, 1);
      container.appendChild(ui.field(t("l8.pairs"), pairs));

      readFields = function () {
        ui.clearErrors(container);
        const words = parseWords(wordsInput.value);
        const count = App.math.int(pairs);
        if (count === null || count < 3 || count > 8) {
          ui.setError(pairs, t("err.pairs"));
          return null;
        }
        if (words.length < count) {
          ui.setError(wordsInput, t("err.pairsWords"));
          return null;
        }
        return { words, pairs: count };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const chosen = rng.shuffle(opts.words).slice(0, opts.pairs);
      const used = new Set();
      const pairs = chosen.map(function (word) {
        const lookup = word.toLowerCase();
        let icon = EMOJI[lookup];
        if (!icon || used.has(icon)) {
          const free = FALLBACK.filter(function (item) {
            return !used.has(item);
          });
          icon = free.length ? free[0] : icon || "🖼️";
        }
        used.add(icon);
        return { word, icon };
      });

      const pictures = rng.shuffle(pairs.slice());
      const words = rng.shuffle(pairs.slice());

      const body = el("div", "match-grid");
      const left = el("div", "match-col");
      const right = el("div", "match-col");
      pictures.forEach(function (pair) {
        left.appendChild(el("div", "match-card match-picture", pair.icon));
      });
      words.forEach(function (pair) {
        right.appendChild(el("div", "match-card", pair.word));
      });
      body.append(left, right);

      const answers = el("div", "match-answers");
      pairs.forEach(function (pair) {
        answers.appendChild(el("div", "match-answer", pair.icon + " — " + pair.word));
      });

      return { body, answers };
    }
  };
})();
