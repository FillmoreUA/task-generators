(function () {
  const App = window.App;
  const t = App.i18n.t.bind(App.i18n);
  const view = document.getElementById("view");

  const ICONS = {
    language:
      '<path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z"></path><path d="M13.5 6.5l4 4"></path>',
    math:
      '<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M12 8v8M8 12h8"></path>'
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONS[type] || ICONS.language;
    return svg;
  }

  function title(item) {
    return t(item.titleKey);
  }

  function desc(item) {
    return t(item.descKey);
  }

  function renderHome() {
    view.innerHTML = "";
    document.title = t("app.title");

    const hero = el("section", "hero");
    const heading = el("h1", null, t("home.heading"));
    const sub = el("p", null, t("home.subtitle"));
    hero.append(heading, sub);

    const toolbar = el("div", "toolbar");
    const search = el("div", "search");
    const input = el("input");
    input.type = "text";
    input.placeholder = t("home.search");
    input.setAttribute("aria-label", t("home.search"));
    search.appendChild(input);

    const chips = el("div", "chips");
    const types = [
      ["all", t("filter.all")],
      ["language", t("filter.language")],
      ["math", t("filter.math")]
    ];
    const state = { query: "", type: "all" };
    const chipButtons = types.map(function (pair) {
      const button = el("button", "chip", pair[1]);
      button.type = "button";
      button.setAttribute("aria-pressed", String(pair[0] === "all"));
      button.addEventListener("click", function () {
        state.type = pair[0];
        chipButtons.forEach(function (other) {
          other.setAttribute("aria-pressed", String(other === button));
        });
        draw();
      });
      chips.appendChild(button);
      return button;
    });

    toolbar.append(search, chips);

    const grid = el("div", "cards");
    const empty = el("div", "empty", t("home.empty"));
    empty.hidden = true;

    function draw() {
      grid.innerHTML = "";
      const query = state.query.trim().toLowerCase();
      const items = App.registry.filter(function (item) {
        if (state.type !== "all" && item.type !== state.type) return false;
        if (!query) return true;
        return (title(item) + " " + desc(item)).toLowerCase().indexOf(query) !== -1;
      });

      items.forEach(function (item) {
        const card = el("a", "card");
        card.href = "#/g/" + item.id;
        const badge = el("div", "card-icon");
        badge.appendChild(icon(item.type));
        card.append(badge, el("h2", null, title(item)), el("p", null, desc(item)));
        grid.appendChild(card);
      });

      empty.hidden = items.length > 0;
    }

    input.addEventListener("input", function () {
      state.query = input.value;
      draw();
    });

    view.append(hero, toolbar, grid, empty);
    draw();
  }

  function loadGenerator(item, done) {
    if (!item.file || App.generators[item.id]) {
      done();
      return;
    }
    const script = document.createElement("script");
    script.src = item.file;
    script.onload = function () {
      done();
    };
    script.onerror = function () {
      done();
    };
    document.body.appendChild(script);
  }

  function renderGenerator(id) {
    const item = App.registry.byId(id);
    if (!item) {
      view.innerHTML = "";
      view.appendChild(el("div", "empty", t("gen.notFound")));
      return;
    }

    view.innerHTML = "";
    const section = el("section", "generator");

    const back = el("a", "back", t("nav.back"));
    back.href = "#/";

    const head = el("div", "generator-head");
    head.append(el("h1", null, title(item)), el("p", null, desc(item)));

    const layout = el("div", "generator-layout");
    const formPanel = el("div", "form-panel no-print");
    const form = el("form", "options");
    form.noValidate = true;

    const storageKey = "opts." + item.id;
    document.title = title(item) + " — " + t("app.title");
    let saved = App.storage.get(storageKey, {});
    if (App.pendingTemplate && App.pendingTemplate.generator === item.id) {
      saved = App.pendingTemplate.options || {};
      App.pendingTemplate = null;
    }

    const titleField = el("div", "field");
    const titleLabel = el("label", null, t("form.title"));
    const titleInput = el("input");
    titleInput.type = "text";
    titleInput.value = saved.title !== undefined ? saved.title : title(item);
    titleLabel.htmlFor = "opt-title";
    titleInput.id = "opt-title";
    titleField.append(titleLabel, titleInput);

    const seedField = el("div", "field");
    const seedLabel = el("label", null, t("form.seed"));
    const seedInput = el("input");
    seedInput.type = "number";
    seedInput.min = "0";
    seedInput.max = "999999";
    seedInput.value = saved.seed !== undefined ? saved.seed : "";
    seedInput.placeholder = t("form.seedHint");
    seedLabel.htmlFor = "opt-seed";
    seedInput.id = "opt-seed";
    const seedHint = el("div", "hint", t("form.seedHint"));
    seedField.append(seedLabel, seedInput, seedHint);

    const nameLabel = el("label", "check");
    const nameCheck = el("input");
    nameCheck.type = "checkbox";
    nameCheck.checked = saved.showName !== undefined ? saved.showName : true;
    nameLabel.append(nameCheck, el("span", null, t("form.name")));

    const answersLabel = el("label", "check");
    const answersCheck = el("input");
    answersCheck.type = "checkbox";
    answersCheck.checked = saved.answers !== undefined ? saved.answers : false;
    answersLabel.append(answersCheck, el("span", null, t("form.answers")));

    const actions = el("div", "actions");
    const extra = el("div", "extra-fields");
    const generateBtn = el("button", "btn primary", t("btn.generate"));
    generateBtn.type = "button";
    const printBtn = el("button", "btn", t("btn.print"));
    printBtn.type = "button";
    const newBtn = el("button", "btn", t("btn.new"));
    newBtn.type = "button";
    actions.append(generateBtn, printBtn, newBtn);

    const hint = el("p", "print-hint no-print", t("print.hint"));

    const tplBar = el("div", "template-save no-print");
    const tplName = el("input");
    tplName.type = "text";
    tplName.placeholder = t("templates.name");
    const tplSaveBtn = el("button", "btn", t("templates.save"));
    tplSaveBtn.type = "button";
    tplBar.append(tplName, tplSaveBtn);
    const tplStatus = el("div", "template-status no-print");
    tplStatus.hidden = true;
    tplStatus.setAttribute("role", "status");

    if (item.supportsAnswers === false) answersLabel.hidden = true;

    form.append(titleField, seedField, nameLabel, answersLabel, extra, actions, hint);
    formPanel.append(form, tplBar, tplStatus);

    const previewPanel = el("div", "preview-panel");
    const stub = el("p", "preview-hint no-print", t("preview.stub"));
    const sheetWrap = el("div", "sheet-wrap");
    sheetWrap.id = "preview";
    previewPanel.append(stub, sheetWrap);

    layout.append(formPanel, previewPanel);
    section.append(back, head, layout);
    view.appendChild(section);

    let impl = App.generators[item.id];

    function readOptions() {
      const seedRaw = seedInput.value.trim();
      let seed = seedRaw === "" ? App.rng.randomSeed() : parseInt(seedRaw, 10);
      if (!isFinite(seed) || seed < 0) seed = App.rng.randomSeed();
      if (seedRaw === "") seedInput.value = String(seed);
      const options = {
        title: titleInput.value.trim() || title(item),
        seed: seed,
        showName: nameCheck.checked,
        answers: answersCheck.checked && item.supportsAnswers !== false
      };
      if (impl && typeof impl.read === "function") {
        const gen = impl.read();
        if (gen === null) return null;
        options.gen = gen || {};
      }
      return options;
    }

    function persist(options) {
      App.storage.set(storageKey, {
        title: titleInput.value,
        seed: options.seed,
        showName: options.showName,
        answers: options.answers,
        gen: options.gen || {}
      });
    }

    function generate() {
      const options = readOptions();
      if (!options) return;
      const params = Object.assign({}, options, options.gen);
      const rng = App.rng.create(options.seed);
      let rendered = null;

      if (impl && typeof impl.render === "function") {
        rendered = impl.render(params, rng) || {};
      }

      App.sheet.render(sheetWrap, {
        title: options.title,
        showName: options.showName,
        pages: rendered ? rendered.pages : null,
        body: rendered ? rendered.body : null,
        answers: options.answers,
        answersBody: rendered ? rendered.answers : null,
        footer: rendered ? rendered.footer : ""
      });

      stub.hidden = !!(impl && typeof impl.render === "function");
      persist(options);
    }

    let timer = null;
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(generate, 150);
    }

    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      generate();
    });

    generateBtn.addEventListener("click", generate);
    printBtn.addEventListener("click", function () {
      window.print();
    });
    newBtn.addEventListener("click", function () {
      seedInput.value = String(App.rng.randomSeed());
      generate();
    });

    tplSaveBtn.addEventListener("click", function () {
      const options = readOptions();
      if (!options) return;
      const name = tplName.value.trim() || options.title;
      App.templates.save({ name: name, generator: item.id, options: options });
      tplStatus.textContent = t("templates.saved");
      tplStatus.classList.remove("error");
      tplStatus.hidden = false;
      tplName.value = "";
    });

    loadGenerator(item, function () {
      impl = App.generators[item.id];
      if (impl && typeof impl.buildForm === "function") {
        impl.buildForm(extra, (saved.gen || {}));
      }
      stub.hidden = !!impl;
      generate();
    });
  }

  function renderTemplates() {
    view.innerHTML = "";
    document.title = t("templates.title") + " — " + t("app.title");

    const section = el("section", "templates");
    const back = el("a", "back", t("templates.back"));
    back.href = "#/";
    const heading = el("h1", null, t("templates.title"));

    const bar = el("div", "templates-bar");
    const exportBtn = el("button", "btn", t("templates.export"));
    exportBtn.type = "button";
    const importLabel = el("label", "btn", t("templates.import"));
    const fileInput = el("input");
    fileInput.type = "file";
    fileInput.accept = "application/json,.json";
    fileInput.hidden = true;
    importLabel.appendChild(fileInput);
    bar.append(exportBtn, importLabel);

    const status = el("div", "template-status");
    status.hidden = true;
    status.setAttribute("role", "status");

    section.append(back, heading, bar, status);

    const list = App.templates.all();
    if (!list.length) {
      section.appendChild(el("div", "empty", t("templates.empty")));
    } else {
      const wrap = el("div", "template-list");
      list.forEach(function (template) {
        const card = el("div", "template-card");
        const meta = el("div", "template-meta");
        const reg = App.registry.byId(template.generator);
        meta.append(
          el("div", "template-name", template.name || (reg ? title(reg) : template.generator)),
          el("div", "template-gen", reg ? title(reg) : template.generator)
        );

        const actions = el("div", "template-actions");
        const load = el("button", "btn primary", t("templates.load"));
        load.type = "button";
        const del = el("button", "btn", t("templates.delete"));
        del.type = "button";

        load.addEventListener("click", function () {
          App.pendingTemplate = template;
          location.hash = "#/g/" + template.generator;
        });
        del.addEventListener("click", function () {
          App.templates.remove(template.id);
          renderTemplates();
        });

        actions.append(load, del);
        card.append(meta, actions);
        wrap.appendChild(card);
      });
      section.appendChild(wrap);
    }

    view.appendChild(section);

    exportBtn.addEventListener("click", function () {
      const data = JSON.stringify(App.templates.all(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const link = el("a");
      link.href = URL.createObjectURL(blob);
      link.download = "templates.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        URL.revokeObjectURL(link.href);
      }, 1000);
    });

    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          App.templates.importData(JSON.parse(reader.result));
          renderTemplates();
        } catch (error) {
          status.textContent = t("templates.importError");
          status.classList.add("error");
          status.hidden = false;
        }
      };
      reader.readAsText(file);
    });
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    if (hash === "templates") {
      renderTemplates();
    } else {
      const match = hash.match(/^g\/([A-Za-z0-9_-]+)$/);
      if (match) {
        renderGenerator(match[1]);
      } else {
        renderHome();
      }
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();
