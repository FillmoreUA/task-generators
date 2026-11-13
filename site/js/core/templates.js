(function () {
  const App = (window.App = window.App || {});
  const KEY = "templates";

  function all() {
    const list = App.storage.get(KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function save(template) {
    const list = all();
    const item = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: String(template.name || ""),
      generator: template.generator,
      options: template.options || {},
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    App.storage.set(KEY, list);
    return item;
  }

  function remove(id) {
    App.storage.set(
      KEY,
      all().filter(function (item) {
        return item.id !== id;
      })
    );
  }

  function importData(data) {
    if (!Array.isArray(data)) throw new Error("invalid");
    const list = all();
    data.forEach(function (item) {
      if (!item || typeof item !== "object" || !item.generator || !item.options) return;
      list.push({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: String(item.name || ""),
        generator: item.generator,
        options: item.options,
        createdAt: item.createdAt || new Date().toISOString()
      });
    });
    App.storage.set(KEY, list);
    return list.length;
  }

  App.templates = { all, save, remove, importData };
})();
