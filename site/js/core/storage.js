(function () {
  const App = (window.App = window.App || {});
  const PREFIX = "tg:";

  App.storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (error) {
        /* storage unavailable */
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(PREFIX + key);
      } catch (error) {
        /* storage unavailable */
      }
    }
  };
})();
