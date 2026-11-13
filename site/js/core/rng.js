(function () {
  const App = (window.App = window.App || {});

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  App.rng = {
    create(seed) {
      const next = mulberry32(xmur3(String(seed))());
      return {
        next,
        int(min, max) {
          return Math.floor(next() * (max - min + 1)) + min;
        },
        pick(list) {
          return list[Math.floor(next() * list.length)];
        },
        shuffle(list) {
          const copy = list.slice();
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(next() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
          }
          return copy;
        }
      };
    },
    randomSeed() {
      return Math.floor(Math.random() * 999999) + 1;
    }
  };
})();
