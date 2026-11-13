(function () {
  const App = (window.App = window.App || {});

  App.registry = [
    { id: "L1", type: "language", file: "js/generators/L1.js", supportsAnswers: false },
    { id: "L2", type: "language", file: "js/generators/L2.js" },
    { id: "L3", type: "language", file: "js/generators/L3.js" },
    { id: "L4", type: "language", file: "js/generators/L4.js", supportsAnswers: false },
    { id: "L5", type: "language", file: "js/generators/L5.js", supportsAnswers: false },
    { id: "L6", type: "language", file: "js/generators/L6.js", supportsAnswers: false },
    { id: "L7", type: "language", file: "js/generators/L7.js" },
    { id: "L8", type: "language", file: "js/generators/L8.js" },
    { id: "L9", type: "language", file: "js/generators/L9.js", supportsAnswers: false },
    { id: "L10", type: "language", file: "js/generators/L10.js", supportsAnswers: false },
    { id: "M1", type: "math", file: "js/generators/M1.js" },
    { id: "M2", type: "math", file: "js/generators/M2.js" },
    { id: "M3", type: "math", file: "js/generators/M3.js" },
    { id: "M4", type: "math", file: "js/generators/M4.js" },
    { id: "M5", type: "math", file: "js/generators/M5.js" },
    { id: "M6", type: "math", file: "js/generators/M6.js" },
    { id: "M7", type: "math", file: "js/generators/M7.js" },
    { id: "M8", type: "math", file: "js/generators/M8.js" },
    { id: "M9", type: "math", file: "js/generators/M9.js" },
    { id: "M10", type: "math", file: "js/generators/M10.js" },
    { id: "M11", type: "math", file: "js/generators/M11.js" }
  ].map(function (item) {
    return Object.assign(
      {
        titleKey: "generator." + item.id + ".title",
        descKey: "generator." + item.id + ".desc",
        supportsAnswers: true
      },
      item
    );
  });

  App.registry.byId = function (id) {
    return this.find(function (item) {
      return item.id === id;
    });
  };
})();
