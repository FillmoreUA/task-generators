(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  const CLUES = {
    4: [8, 6, 4],
    6: [18, 14, 10],
    9: [40, 32, 26]
  };

  function dims(size) {
    if (size === 4) return [2, 2];
    if (size === 6) return [2, 3];
    return [3, 3];
  }

  function valid(grid, size, boxH, boxW, r, c, n) {
    for (let i = 0; i < size; i++) {
      if (grid[r * size + i] === n) return false;
      if (grid[i * size + c] === n) return false;
    }
    const br = Math.floor(r / boxH) * boxH;
    const bc = Math.floor(c / boxW) * boxW;
    for (let rr = 0; rr < boxH; rr++) {
      for (let cc = 0; cc < boxW; cc++) {
        if (grid[(br + rr) * size + bc + cc] === n) return false;
      }
    }
    return true;
  }

  function fill(grid, size, boxH, boxW, rng) {
    const numbers = [];
    for (let i = 1; i <= size; i++) numbers.push(i);

    function backtrack(pos) {
      if (pos === size * size) return true;
      const r = Math.floor(pos / size);
      const c = pos % size;
      const candidates = rng.shuffle(numbers);
      for (const n of candidates) {
        if (!valid(grid, size, boxH, boxW, r, c, n)) continue;
        grid[pos] = n;
        if (backtrack(pos + 1)) return true;
        grid[pos] = 0;
      }
      return false;
    }

    return backtrack(0);
  }

  function countSolutions(grid, size, boxH, boxW, limit) {
    let best = -1;
    let bestCandidates = null;
    const numbers = [];
    for (let i = 1; i <= size; i++) numbers.push(i);

    for (let pos = 0; pos < size * size; pos++) {
      if (grid[pos]) continue;
      const r = Math.floor(pos / size);
      const c = pos % size;
      const candidates = numbers.filter(function (n) {
        return valid(grid, size, boxH, boxW, r, c, n);
      });
      if (!candidates.length) return 0;
      if (!bestCandidates || candidates.length < bestCandidates.length) {
        best = pos;
        bestCandidates = candidates;
        if (candidates.length === 1) break;
      }
    }

    if (best === -1) return 1;

    let total = 0;
    for (const n of bestCandidates) {
      grid[best] = n;
      total += countSolutions(grid, size, boxH, boxW, limit);
      grid[best] = 0;
      if (total >= limit) break;
    }
    return total;
  }

  function makePuzzle(size, difficulty, rng) {
    const box = dims(size);
    const boxH = box[0];
    const boxW = box[1];
    const solution = new Array(size * size).fill(0);
    fill(solution, size, boxH, boxW, rng);

    const puzzle = solution.slice();
    const cells = rng.shuffle(
      Array.from({ length: size * size }, function (_, index) {
        return index;
      })
    );
    const target = CLUES[size][difficulty];
    let clues = size * size;

    for (const index of cells) {
      if (clues <= target) break;
      const backup = puzzle[index];
      puzzle[index] = 0;
      const copy = puzzle.slice();
      if (countSolutions(copy, size, boxH, boxW, 2) !== 1) {
        puzzle[index] = backup;
      } else {
        clues--;
      }
    }

    return { puzzle, solution, size, boxH, boxW };
  }

  function gridNode(cells, size, boxH, boxW, showNumbers, fontPt) {
    const node = el("div", "sudoku");
    node.style.setProperty("--n", String(size));
    node.style.fontSize = fontPt + "pt";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const value = cells[r * size + c];
        const cell = el("div", "sudoku-cell" + (showNumbers && value ? "" : " blank"), showNumbers && value ? String(value) : "");
        if (r > 0 && r % boxH === 0) cell.classList.add("bt");
        if (c > 0 && c % boxW === 0) cell.classList.add("bl");
        node.appendChild(cell);
      }
    }
    return node;
  }

  App.generators.M11 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const size = ui.select(
        [
          ["4", "4 × 4"],
          ["6", "6 × 6"],
          ["9", "9 × 9"]
        ],
        String(opts.size || 4)
      );
      container.appendChild(ui.field(t("form.sudokuSize"), size));

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
        return {
          size: parseInt(size.value, 10),
          difficulty: parseInt(difficulty.value, 10)
        };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts, rng) {
      const result = makePuzzle(opts.size, opts.difficulty, rng);
      const fontPt = opts.size === 4 ? 22 : opts.size === 6 ? 18 : 14;

      const body = el("div", "sudoku-wrap");
      body.appendChild(gridNode(result.puzzle, opts.size, result.boxH, result.boxW, true, fontPt));

      const answers = el("div", "sudoku-wrap");
      answers.appendChild(gridNode(result.solution, opts.size, result.boxH, result.boxW, true, fontPt));

      return { body, answers };
    }
  };
})();
