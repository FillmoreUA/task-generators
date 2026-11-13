(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  function parseEntries(text) {
    const entries = [];
    text.split("\n").forEach(function (line) {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^(.*?)\s*[—–:]\s*(.+)$/);
      if (!match) return;
      const word = match[1]
        .toUpperCase()
        .replace(/[^А-ЯІЇЄҐA-Z]/g, "");
      if (word.length < 2) return;
      entries.push({ word, clue: match[2].trim() });
    });
    return entries;
  }

  function key(r, c) {
    return r + ":" + c;
  }

  function validPlacement(word, dir, r, c, cells) {
    const dr = dir === "V" ? 1 : 0;
    const dc = dir === "H" ? 1 : 0;

    if (cells[key(r - dr, c - dc)]) return 0;
    if (cells[key(r + dr * word.length, c + dc * word.length)]) return 0;

    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      const existing = cells[key(rr, cc)];
      if (existing) {
        if (existing.letter !== word[i]) return 0;
        if (existing.dirs.has(dir)) return 0;
        intersections++;
      } else {
        const nr = dir === "H" ? 1 : 0;
        const nc = dir === "H" ? 0 : 1;
        if (cells[key(rr - nr, cc - nc)]) return 0;
        if (cells[key(rr + nr, cc + nc)]) return 0;
      }
    }
    return intersections;
  }

  function place(placement, cells) {
    const dr = placement.dir === "V" ? 1 : 0;
    const dc = placement.dir === "H" ? 1 : 0;
    for (let i = 0; i < placement.word.length; i++) {
      const rr = placement.r + dr * i;
      const cc = placement.c + dc * i;
      const existing = cells[key(rr, cc)];
      if (existing) {
        existing.dirs.add(placement.dir);
      } else {
        cells[key(rr, cc)] = {
          letter: placement.word[i],
          dirs: new Set([placement.dir])
        };
      }
    }
  }

  function bounds(cells) {
    let minR = Infinity;
    let maxR = -Infinity;
    let minC = Infinity;
    let maxC = -Infinity;
    Object.keys(cells).forEach(function (k) {
      const parts = k.split(":");
      const r = parseInt(parts[0], 10);
      const c = parseInt(parts[1], 10);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });
    return { minR, maxR, minC, maxC };
  }

  function layout(entries, maxSize, rng) {
    const ordered = rng.shuffle(entries).sort(function (a, b) {
      return b.word.length - a.word.length;
    });
    const first = ordered[0];
    const cells = {};
    const placed = [{ word: first.word, clue: first.clue, dir: "H", r: 0, c: 0 }];
    place(placed[0], cells);

    for (let i = 1; i < ordered.length; i++) {
      const entry = ordered[i];
      const candidates = [];

      placed.forEach(function (existing) {
        for (let pi = 0; pi < existing.word.length; pi++) {
          const ch = existing.word[pi];
          for (let wi = 0; wi < entry.word.length; wi++) {
            if (entry.word[wi] !== ch) continue;
            const pr = existing.r + (existing.dir === "V" ? pi : 0);
            const pc = existing.c + (existing.dir === "H" ? pi : 0);
            const dir = existing.dir === "H" ? "V" : "H";
            const r = pr - (dir === "V" ? wi : 0);
            const c = pc - (dir === "H" ? wi : 0);
            const score = validPlacement(entry.word, dir, r, c, cells);
            if (!score) continue;
            candidates.push({ word: entry.word, clue: entry.clue, dir, r, c, score });
          }
        }
      });

      const fitting = candidates.filter(function (candidate) {
        const dr = candidate.dir === "V" ? 1 : 0;
        const dc = candidate.dir === "H" ? 1 : 0;
        const test = Object.assign({}, cells);
        place(candidate, test);
        const box = bounds(test);
        return box.maxR - box.minR + 1 <= maxSize && box.maxC - box.minC + 1 <= maxSize;
      });

      if (!fitting.length) continue;
      const best = fitting.reduce(function (max, item) {
        return Math.max(max, item.score);
      }, 0);
      const top = fitting.filter(function (item) {
        return item.score === best;
      });
      const chosen = rng.pick(top);
      placed.push(chosen);
      place(chosen, cells);
    }

    return { placed, cells };
  }

  function buildBest(entries, maxSize, rng) {
    let best = null;
    for (let attempt = 0; attempt < 24; attempt++) {
      const result = layout(entries, maxSize, rng);
      if (!best || result.placed.length > best.placed.length) best = result;
      if (best.placed.length === entries.length) break;
    }
    return best;
  }

  function gridNode(cells, numbers, rows, cols, showLetters, fontPt) {
    const node = el("div", "crossword");
    node.style.setProperty("--cols", String(cols));
    node.style.fontSize = fontPt + "pt";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells[key(r, c)];
        if (!cell) {
          node.appendChild(el("div", "cw-cell black"));
          continue;
        }
        const wrapper = el("div", "cw-cell");
        if (numbers[key(r, c)]) {
          wrapper.appendChild(el("span", "cw-num", String(numbers[key(r, c)])));
        }
        if (showLetters) wrapper.appendChild(el("span", "cw-letter", cell.letter));
        node.appendChild(wrapper);
      }
    }
    return node;
  }

  function cluesNode(title, list) {
    const section = el("div", "cw-clue-section");
    section.appendChild(el("div", "cw-clue-title", title));
    list.forEach(function (item) {
      section.appendChild(el("div", "cw-clue", item.num + ". " + item.clue));
    });
    return section;
  }

  App.generators.L7 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const entriesInput = ui.el("textarea");
      entriesInput.value =
        opts.entries !== undefined
          ? opts.entries
          : "кіт — свійська тварина, ловить мишей\nсонце — зірка, що світить удень\nшкола — місце, де діти навчаються\nкнига — джерело знань";
      entriesInput.placeholder = t("l7.hint");
      container.appendChild(ui.field(t("l7.entries"), entriesInput, t("l7.hint")));

      const maxSize = ui.numberInput(opts.maxSize !== undefined ? opts.maxSize : 15, 5, 25, 1);
      container.appendChild(ui.field(t("l7.maxSize"), maxSize));

      readFields = function () {
        ui.clearErrors(container);
        const entries = parseEntries(entriesInput.value);
        if (entries.length < 2) {
          ui.setError(entriesInput, t("err.crosswordEntries"));
          return null;
        }
        if (entries.length > 20) {
          ui.setError(entriesInput, t("err.crosswordMax"));
          return null;
        }
        const size = App.math.int(maxSize);
        if (size === null || size < 5 || size > 25) {
          ui.setError(maxSize, t("err.crosswordSize"));
          return null;
        }
        const long = entries.find(function (entry) {
          return entry.word.length > size;
        });
        if (long) {
          ui.setError(entriesInput, t("err.wordLong") + " «" + long.word + "»");
          return null;
        }
        return { entries, maxSize: size };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const best = buildBest(opts.entries, opts.maxSize, rng);
      if (!best || best.placed.length < 2) {
        return { body: el("div", "empty", t("err.crosswordPlace")) };
      }

      const box = bounds(best.cells);
      const rows = box.maxR - box.minR + 1;
      const cols = box.maxC - box.minC + 1;
      const cells = {};
      Object.keys(best.cells).forEach(function (k) {
        const parts = k.split(":");
        const r = parseInt(parts[0], 10) - box.minR;
        const c = parseInt(parts[1], 10) - box.minC;
        cells[key(r, c)] = best.cells[k];
      });

      const numbers = {};
      let counter = 0;
      const across = [];
      const down = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[key(r, c)];
          if (!cell) continue;
          const startsAcross = !cells[key(r, c - 1)] && cells[key(r, c + 1)];
          const startsDown = !cells[key(r - 1, c)] && cells[key(r + 1, c)];
          if (!startsAcross && !startsDown) continue;
          counter++;
          numbers[key(r, c)] = counter;
          if (startsAcross) {
            const found = best.placed.find(function (p) {
              return p.dir === "H" && p.r - box.minR === r && p.c - box.minC === c;
            });
            if (found) across.push({ num: counter, clue: found.clue, answer: found.word });
          }
          if (startsDown) {
            const found = best.placed.find(function (p) {
              return p.dir === "V" && p.r - box.minR === r && p.c - box.minC === c;
            });
            if (found) down.push({ num: counter, clue: found.clue, answer: found.word });
          }
        }
      }

      across.sort(function (a, b) { return a.num - b.num; });
      down.sort(function (a, b) { return a.num - b.num; });

      const fontPt = cols <= 10 ? 16 : cols <= 15 ? 12 : 9;
      const body = el("div", "cw-body");
      body.appendChild(gridNode(cells, numbers, rows, cols, false, fontPt));
      const clues = el("div", "cw-clues");
      if (across.length) clues.appendChild(cluesNode(t("cw.across"), across));
      if (down.length) clues.appendChild(cluesNode(t("cw.down"), down));
      body.appendChild(clues);

      const answers = el("div", "cw-body");
      answers.appendChild(gridNode(cells, numbers, rows, cols, true, fontPt));

      return { body, answers };
    }
  };
})();
