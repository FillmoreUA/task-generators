(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;

  const ALPHABET = {
    UA: "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ",
    PL: "AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ",
    EN: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  };

  const DIRS = {
    right: [0, 1],
    down: [1, 0],
    left: [0, -1],
    up: [-1, 0]
  };

  let readFields = null;

  function parseWords(text) {
    return text
      .split(/[\n,;]+/)
      .map(function (word) {
        return word.trim().toUpperCase();
      })
      .filter(function (word) {
        return word.length > 0;
      });
  }

  function normalize(word) {
    return word.replace(/['’ʼ\- ]/g, "");
  }

  function makeGrid(words, size, dirs, rng, alphabet) {
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid.push(new Array(size).fill(""));
    }
    const placements = [];

    for (const word of words) {
      let placed = false;
      for (let attempt = 0; attempt < 400 && !placed; attempt++) {
        const dir = rng.pick(dirs);
        const delta = DIRS[dir];
        const dr = delta[0];
        const dc = delta[1];
        const len = word.length;

        let rMin = 0;
        let rMax = size - 1;
        let cMin = 0;
        let cMax = size - 1;
        if (dr > 0) rMax = size - len;
        if (dr < 0) rMin = len - 1;
        if (dc > 0) cMax = size - len;
        if (dc < 0) cMin = len - 1;
        if (rMin > rMax || cMin > cMax) continue;

        const r0 = rng.int(rMin, rMax);
        const c0 = rng.int(cMin, cMax);
        const cells = [];
        let ok = true;
        for (let i = 0; i < len; i++) {
          const r = r0 + dr * i;
          const c = c0 + dc * i;
          const current = grid[r][c];
          if (current && current !== word[i]) {
            ok = false;
            break;
          }
          cells.push([r, c]);
        }
        if (!ok) continue;

        cells.forEach(function (cell, i) {
          grid[cell[0]][cell[1]] = word[i];
        });
        placements.push({ word, cells });
        placed = true;
      }
      if (!placed) return null;
    }

    const letters = alphabet.split("");
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) grid[r][c] = rng.pick(letters);
      }
    }
    return { grid, placements };
  }

  function buildGrid(words, size, dirs, rng, alphabet) {
    const ordered = rng.shuffle(words).sort(function (a, b) {
      return b.length - a.length;
    });
    for (let attempt = 0; attempt < 60; attempt++) {
      const result = makeGrid(ordered, size, dirs, rng, alphabet);
      if (result) return result;
    }
    return null;
  }

  function gridNode(result, size, reveal) {
    const grid = el("div", "wordsearch");
    grid.style.setProperty("--n", String(size));
    grid.style.fontSize = (size <= 12 ? 17 : size <= 16 ? 14 : 11) + "pt";
    const hits = new Set();
    if (reveal) {
      result.placements.forEach(function (placement) {
        placement.cells.forEach(function (cell) {
          hits.add(cell[0] + ":" + cell[1]);
        });
      });
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = el("div", "ws-cell", result.grid[r][c]);
        if (hits.has(r + ":" + c)) cell.classList.add("hit");
        grid.appendChild(cell);
      }
    }
    return grid;
  }

  function wordsNode(words) {
    const box = el("div", "ws-words");
    words.forEach(function (word) {
      box.appendChild(el("span", "ws-word", word));
    });
    return box;
  }

  App.generators.L2 = {
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
      const themeField = ui.field(t("form.theme"), theme);
      container.appendChild(themeField);

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
        if (opts.theme !== undefined && String(opts.theme) !== "") {
          theme.value = String(opts.theme);
        } else if (theme.children.length > 1) {
          theme.value = "0";
        }
      }
      fillThemes();

      const wordsInput = el("textarea");
      wordsInput.value =
        opts.words !== undefined
          ? opts.words
          : App.wordsets.UA.themes[0].words.join(", ");
      wordsInput.placeholder = t("form.wordsHint");
      container.appendChild(ui.field(t("form.words"), wordsInput, t("form.wordsHint")));

      const size = ui.numberInput(opts.size !== undefined ? opts.size : 14, 12, 20, 1);
      container.appendChild(ui.field(t("form.gridSize"), size));

      const dirWrap = el("div", "field");
      dirWrap.appendChild(el("label", null, t("form.directions")));
      const dirRow = el("div", "dir-row");
      const dirs = [
        ["right", t("dir.right")],
        ["down", t("dir.down")],
        ["left", t("dir.left")],
        ["up", t("dir.up")]
      ];
      const dirInputs = {};
      dirs.forEach(function (pair) {
        const check = ui.checkbox(pair[1], opts.dirs && opts.dirs.indexOf(pair[0]) === -1 ? false : true);
        check.label.classList.add("check-mini");
        dirInputs[pair[0]] = check;
        dirRow.appendChild(check.label);
      });
      dirWrap.appendChild(dirRow);
      container.appendChild(dirWrap);

      const hideWords = ui.checkbox(t("form.hideWords"), !!opts.hideWords);
      container.appendChild(hideWords.label);

      language.addEventListener("change", fillThemes);

      theme.addEventListener("change", function () {
        const sets = App.wordsets[language.value];
        if (!sets || theme.value === "") return;
        const set = sets.themes[parseInt(theme.value, 10)];
        if (!set) return;
        wordsInput.value = set.words.join(", ");
      });

      readFields = function () {
        ui.clearErrors(container);
        const rawWords = parseWords(wordsInput.value);
        const words = rawWords.map(normalize).filter(function (word) {
          return word.length > 0;
        });
        if (!words.length) {
          ui.setError(wordsInput, t("err.words"));
          return null;
        }
        if (words.length > 15) {
          ui.setError(wordsInput, t("err.wordsMax"));
          return null;
        }
        const gridSize = App.math.int(size);
        if (gridSize === null || gridSize < 12 || gridSize > 20) {
          ui.setError(size, t("err.gridSize"));
          return null;
        }
        for (const word of words) {
          if (word.length > gridSize) {
            ui.setError(wordsInput, t("err.wordLong") + " «" + word + "»");
            return null;
          }
        }
        const activeDirs = Object.keys(dirInputs).filter(function (key) {
          return dirInputs[key].input.checked;
        });
        if (!activeDirs.length) {
          ui.setError(dirRow, t("err.directions"));
          return null;
        }
        return {
          language: language.value,
          theme: theme.value,
          words,
          size: gridSize,
          dirs: activeDirs,
          hideWords: hideWords.input.checked
        };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const alphabet = ALPHABET[opts.language] || ALPHABET.UA;
      const result = buildGrid(opts.words, opts.size, opts.dirs, rng, alphabet);
      if (!result) {
        return { body: el("div", "empty", t("err.place")) };
      }
      const body = el("div", "ws-body");
      body.appendChild(gridNode(result, opts.size, false));
      if (!opts.hideWords) body.appendChild(wordsNode(opts.words));

      const answers = el("div", "ws-body");
      answers.appendChild(gridNode(result, opts.size, true));
      answers.appendChild(wordsNode(opts.words));

      return { body, answers };
    }
  };
})();
