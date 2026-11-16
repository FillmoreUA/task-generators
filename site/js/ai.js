(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;

  const STORAGE_KEY = "ai.last";
  const CHATGPT_URL = "https://chatgpt.com/";

  const GRADES = [
    ["preschool", "ai.gradePreschool"],
    ["grade1", "ai.grade1"],
    ["grade2", "ai.grade2"],
    ["grade3", "ai.grade3"],
    ["grade4", "ai.grade4"],
    ["grade5", "ai.grade5"]
  ];

  const TYPES = [
    ["questions", "ai.typeQuestions"],
    ["tasks", "ai.typeTasks"],
    ["reading", "ai.typeReading"],
    ["creative", "ai.typeCreative"],
    ["mixed", "ai.typeMixed"]
  ];

  const DEFAULTS = {
    subject: "",
    topic: "",
    grade: "grade2",
    type: "mixed",
    count: 5,
    difficulty: "medium",
    lines: 2,
    answers: true,
    showName: true,
    title: ""
  };

  function str(value) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }

  function pick(source, keys) {
    for (let i = 0; i < keys.length; i++) {
      const value = source[keys[i]];
      if (value !== undefined && value !== null) return value;
    }
    return "";
  }

  function labelFor(list, value) {
    for (let i = 0; i < list.length; i++) {
      if (list[i][0] === value) return t(list[i][1]);
    }
    return value;
  }

  function difficultyLabel(value) {
    if (value === "easy") return t("ai.easy");
    if (value === "hard") return t("ai.hard");
    return t("ai.medium");
  }

  function typeInstruction(value) {
    if (value === "questions") {
      return "Склади запитання за темою, на які учень має відповісти письмово.";
    }
    if (value === "tasks") {
      return "Склади практичні завдання та задачі, які треба розв'язати письмово.";
    }
    if (value === "reading") {
      return "Склади короткий текст для читання (до 900 символів) і запитання до нього.";
    }
    if (value === "creative") {
      return "Склади творчі завдання, які розвивають уяву та мовлення.";
    }
    return "Поєднай запитання, практичні та творчі завдання.";
  }

  function buildPrompt(settings) {
    const subject = settings.subject || "Загальний розвиток";
    const grade = labelFor(GRADES, settings.grade);
    const lines = [
      "Ти — досвідчений український учитель. Підготуй навчальний матеріал для одного аркуша A4.",
      "Предмет: " + subject + ".",
      "Тема: " + (settings.topic || "вкажіть тему") + ".",
      "Клас / вік: " + grade + ".",
      "Тип завдання: " + labelFor(TYPES, settings.type) + ".",
      typeInstruction(settings.type),
      "Кількість завдань: " + settings.count + ".",
      "Складність: " + difficultyLabel(settings.difficulty) + ".",
      "Мова: українська.",
      "",
      "Вимоги:",
      "- завдання мають бути різними, зрозумілими та відповідати віку;",
      "- не використовуй політику, релігію, насильство та персональні дані;",
      "- кожне завдання — до 180 символів, без нумерації в полі text;",
      "- для типу «Текст для читання» поклади текст в intro, а запитання — в tasks;",
      "- подай короткі правильні відповіді в answer; якщо відповіді немає — порожній рядок.",
      "",
      "Поверни ЛИШЕ валідний JSON без markdown, коментарів і тексту до або після нього:",
      '{"title":"Назва аркуша","instruction":"Інструкція для учня","intro":"","tasks":[{"text":"Текст завдання","answer":"Коротка відповідь"}]}',
      "",
      "У tasks має бути рівно " + settings.count + " елементів."
    ];
    if (settings.title) {
      lines.splice(4, 0, "Назва аркуша: «" + settings.title + "». Використай її в полі title.");
    }
    return lines.join("\n");
  }

  function normalizeTask(item) {
    if (typeof item === "string") {
      return { text: str(item), answer: "" };
    }
    if (!item || typeof item !== "object") return null;
    const text = pick(item, ["text", "task", "question", "prompt", "statement"]);
    const answer = pick(item, ["answer", "solution", "response", "a"]);
    return { text: str(text), answer: str(answer) };
  }

  function normalizeData(data) {
    if (!data || typeof data !== "object") return null;
    const rawTasks = data.tasks || data.questions || data.exercises || data.items;
    if (!Array.isArray(rawTasks)) return null;
    const tasks = rawTasks
      .map(normalizeTask)
      .filter(function (task) {
        return task && task.text;
      })
      .slice(0, 30);
    if (!tasks.length) return null;
    return {
      title: str(pick(data, ["title", "name"])),
      instruction: str(pick(data, ["instruction", "instructions", "directions"])),
      intro: str(pick(data, ["intro", "text", "passage", "reading"])),
      tasks: tasks
    };
  }

  function parseNumbered(text) {
    const rows = text.replace(/\r/g, "").split("\n");
    const tasks = [];
    let current = null;
    rows.forEach(function (row) {
      const line = row.trim();
      if (!line || /^```/.test(line)) return;
      const match = line.match(/^(?:\(?\d{1,2}[.)\-:]|[-*•])\s+(.+)$/);
      if (match) {
        if (current && current.text) tasks.push(current);
        current = { text: match[1].trim(), answer: "" };
      } else if (current) {
        current.text += " " + line;
      }
    });
    if (current && current.text) tasks.push(current);
    if (!tasks.length) {
      const parts = text
        .split(/\n{2,}/)
        .map(function (part) {
          return part.trim();
        })
        .filter(function (part) {
          return part && !/^```/.test(part);
        });
      if (parts.length > 1) {
        parts.forEach(function (part) {
          tasks.push({ text: part, answer: "" });
        });
      }
    }
    if (!tasks.length) return null;
    return {
      title: "",
      instruction: "",
      intro: "",
      tasks: tasks.slice(0, 30)
    };
  }

  function parseResponse(raw) {
    let text = str(raw);
    if (!text) return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) text = fence[1].trim();

    let data = null;
    const open = text.indexOf("{");
    const close = text.lastIndexOf("}");
    if (open !== -1 && close > open) {
      try {
        data = JSON.parse(text.slice(open, close + 1));
      } catch (error) {
        data = null;
      }
    }
    if (!data) {
      const arrayOpen = text.indexOf("[");
      const arrayClose = text.lastIndexOf("]");
      if (arrayOpen !== -1 && arrayClose > arrayOpen) {
        try {
          const array = JSON.parse(text.slice(arrayOpen, arrayClose + 1));
          if (Array.isArray(array)) data = { tasks: array };
        } catch (error) {
          data = null;
        }
      }
    }
    if (data) {
      const normalized = normalizeData(data);
      if (normalized) return normalized;
    }
    return parseNumbered(text);
  }

  function makeTask(task, index, lines) {
    const item = el("div", "ai-task");
    const text = el("div", "ai-task-text");
    text.appendChild(el("span", "ai-task-num", String(index + 1) + "."));
    text.appendChild(document.createTextNode(" " + task.text));
    item.appendChild(text);
    if (lines > 0) {
      const zone = el("div", "ai-answer-lines");
      for (let i = 0; i < lines; i++) {
        zone.appendChild(el("div", "write-line ai-answer-line"));
      }
      item.appendChild(zone);
    }
    return item;
  }

  function makePages(data, settings) {
    const tasks = data.tasks;
    const lines = Math.max(1, Math.min(3, parseInt(settings.lines, 10) || 2));
    const perPage = data.intro ? (lines >= 3 ? 3 : 4) : lines >= 3 ? 4 : 5;
    const pageCount = Math.ceil(tasks.length / perPage);
    const chunkSize = Math.ceil(tasks.length / pageCount);
    const pages = [];

    for (let start = 0; start < tasks.length; start += chunkSize) {
      const body = el("div", "ai-body");
      if (start === 0) {
        body.appendChild(
          el("div", "ai-instruction", data.instruction || t("ai.defaultInstruction"))
        );
        if (data.intro) {
          body.appendChild(el("div", "ai-intro", data.intro));
        }
      }
      const list = el("div", "ai-task-list");
      tasks.slice(start, start + chunkSize).forEach(function (task, offset) {
        list.appendChild(makeTask(task, start + offset, lines));
      });
      body.appendChild(list);
      pages.push(body);
    }
    return pages;
  }

  function makeAnswers(data) {
    const hasAnswers = data.tasks.some(function (task) {
      return !!task.answer;
    });
    if (!hasAnswers) return null;
    const wrap = el("div", "ai-answers");
    const list = el("div", "ai-answers-list");
    data.tasks.forEach(function (task, index) {
      const row = el("div", "ai-answer");
      row.appendChild(el("span", "ai-answer-num", String(index + 1) + "."));
      row.appendChild(el("span", "ai-answer-text", task.answer || "—"));
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function copyText(value, fallbackField) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(
          function () {
            resolve(true);
          },
          function () {
            resolve(fallbackCopy(fallbackField));
          }
        );
      } else {
        resolve(fallbackCopy(fallbackField));
      }
    });
  }

  function fallbackCopy(field) {
    if (!field) return false;
    try {
      field.focus();
      field.select();
      const copied = document.execCommand("copy");
      field.setSelectionRange(0, 0);
      return copied;
    } catch (error) {
      return false;
    }
  }

  function render(view) {
    document.title = t("ai.title") + " — " + t("app.title");
    const saved = App.storage.get(STORAGE_KEY, {}) || {};
    const state = Object.assign({}, DEFAULTS, saved);

    view.innerHTML = "";
    const section = el("section", "generator ai-page");
    const back = el("a", "back", t("nav.back"));
    back.href = "#/";

    const head = el("div", "generator-head");
    head.append(el("h1", null, t("ai.title")), el("p", null, t("ai.lead")));

    const layout = el("div", "generator-layout");
    const formPanel = el("div", "form-panel ai-form-panel no-print");
    const form = el("form", "options");
    form.noValidate = true;

    const subjectInput = el("input");
    subjectInput.type = "text";
    subjectInput.className = "ai-subject";
    subjectInput.value = state.subject;
    subjectInput.placeholder = t("ai.subjectPlaceholder");

    const topicInput = el("input");
    topicInput.type = "text";
    topicInput.className = "ai-topic";
    topicInput.value = state.topic;
    topicInput.placeholder = t("ai.topicPlaceholder");

    const gradeSelect = ui.select(
      GRADES.map(function (pair) {
        return [pair[0], t(pair[1])];
      }),
      state.grade
    );
    gradeSelect.className = "ai-grade";

    const typeSelect = ui.select(
      TYPES.map(function (pair) {
        return [pair[0], t(pair[1])];
      }),
      state.type
    );
    typeSelect.className = "ai-type";

    const countInput = ui.numberInput(state.count, 1, 10, 1);
    countInput.className = "ai-count";

    const difficultySelect = ui.select(
      [
        ["easy", t("ai.easy")],
        ["medium", t("ai.medium")],
        ["hard", t("ai.hard")]
      ],
      state.difficulty
    );
    difficultySelect.className = "ai-difficulty";

    const linesSelect = ui.select(
      [
        ["1", "1"],
        ["2", "2"],
        ["3", "3"]
      ],
      String(state.lines)
    );
    linesSelect.className = "ai-lines";

    const titleInput = el("input");
    titleInput.type = "text";
    titleInput.className = "ai-title";
    titleInput.value = state.title;
    titleInput.placeholder = t("ai.titleFallback");

    const answersToggle = ui.checkbox(t("ai.askAnswers"), state.answers);
    const nameToggle = ui.checkbox(t("ai.showName"), state.showName);

    const firstRow = el("div", "ai-row");
    firstRow.append(ui.field(t("ai.grade"), gradeSelect), ui.field(t("ai.lines"), linesSelect));

    const secondRow = el("div", "ai-row");
    secondRow.append(
      ui.field(t("ai.count"), countInput),
      ui.field(t("ai.difficulty"), difficultySelect)
    );

    const promptBox = el("textarea", "ai-prompt");
    promptBox.readOnly = true;
    promptBox.spellcheck = false;
    promptBox.setAttribute("aria-label", t("ai.prompt"));

    const promptActions = el("div", "ai-actions");
    const copyBtn = el("button", "btn ai-copy", t("ai.copyPrompt"));
    copyBtn.type = "button";
    const openBtn = el("button", "btn primary ai-open", t("ai.copyAndOpen"));
    openBtn.type = "button";
    promptActions.append(copyBtn, openBtn);
    const openHint = el("p", "ai-note", t("ai.openHint"));

    const responseBox = el("textarea", "ai-response");
    responseBox.spellcheck = false;
    responseBox.placeholder = t("ai.responsePlaceholder");

    const responseActions = el("div", "ai-actions");
    const buildBtn = el("button", "btn primary ai-build", t("ai.build"));
    buildBtn.type = "button";
    const clearBtn = el("button", "btn ai-clear", t("ai.clear"));
    clearBtn.type = "button";
    responseActions.append(buildBtn, clearBtn);

    const status = el("div", "ai-status");
    status.hidden = true;
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    form.append(
      el("div", "ai-step-title", t("ai.step1")),
      ui.field(t("ai.subject"), subjectInput),
      ui.field(t("ai.topic"), topicInput),
      firstRow,
      ui.field(t("ai.type"), typeSelect),
      secondRow,
      ui.field(t("ai.sheetTitle"), titleInput),
      answersToggle.label,
      nameToggle.label,
      el("div", "ai-step-title", t("ai.step2")),
      ui.field(t("ai.prompt"), promptBox, t("ai.promptHint")),
      promptActions,
      openHint,
      el("div", "ai-step-title", t("ai.step3")),
      ui.field(t("ai.response"), responseBox, t("ai.responseHint")),
      responseActions,
      status
    );

    const previewPanel = el("div", "preview-panel ai-preview");
    const stub = el("p", "preview-hint no-print", t("ai.previewEmpty"));
    const tools = el("div", "actions no-print");
    tools.hidden = true;
    const printBtn = el("button", "btn primary", t("btn.print"));
    printBtn.type = "button";
    tools.appendChild(printBtn);
    const printHint = el("p", "print-hint no-print", t("print.hint"));
    const sheetWrap = el("div", "sheet-wrap");
    sheetWrap.id = "ai-preview";
    previewPanel.append(stub, tools, printHint, sheetWrap);

    layout.append(formPanel, previewPanel);
    formPanel.append(form);
    section.append(back, head, layout);
    view.appendChild(section);

    function currentSettings() {
      return {
        subject: subjectInput.value.trim(),
        topic: topicInput.value.trim(),
        grade: gradeSelect.value,
        type: typeSelect.value,
        count: Math.max(1, Math.min(10, parseInt(countInput.value, 10) || 1)),
        difficulty: difficultySelect.value,
        lines: parseInt(linesSelect.value, 10) || 1,
        answers: answersToggle.input.checked,
        showName: nameToggle.input.checked,
        title: titleInput.value.trim()
      };
    }

    function saveState() {
      App.storage.set(
        STORAGE_KEY,
        Object.assign({}, currentSettings(), { response: responseBox.value })
      );
    }

    function setStatus(message, isError) {
      status.textContent = message;
      status.classList.toggle("error", !!isError);
      status.hidden = !message;
    }

    function updatePrompt() {
      promptBox.value = buildPrompt(currentSettings());
    }

    function readValidTopic() {
      ui.clearErrors(form);
      if (!topicInput.value.trim()) {
        ui.setError(topicInput, t("ai.errTopic"));
        topicInput.focus();
        return false;
      }
      return true;
    }

    function createSheet(showErrors) {
      const settings = currentSettings();
      const raw = responseBox.value.trim();
      if (!raw) {
        if (showErrors) setStatus(t("ai.errEmptyResponse"), true);
        return false;
      }
      const data = parseResponse(raw);
      if (!data) {
        if (showErrors) setStatus(t("ai.errParse"), true);
        return false;
      }
      const pages = makePages(data, settings);
      if (!pages.length) {
        if (showErrors) setStatus(t("ai.errParse"), true);
        return false;
      }
      const answersBody = settings.answers ? makeAnswers(data) : null;
      const title =
        settings.title ||
        data.title ||
        ((settings.subject ? settings.subject + ": " : "") +
          (settings.topic || t("ai.titleFallback")));
      App.sheet.render(sheetWrap, {
        title: title,
        showName: settings.showName,
        pages: pages,
        answers: !!answersBody,
        answersBody: answersBody
      });
      stub.hidden = true;
      tools.hidden = false;
      const message = t("ai.statusParsed").replace("{n}", String(data.tasks.length));
      setStatus(message + (answersBody ? " " + t("ai.statusAnswers") : ""), false);
      saveState();
      return true;
    }

    function clearAll() {
      subjectInput.value = DEFAULTS.subject;
      topicInput.value = DEFAULTS.topic;
      gradeSelect.value = DEFAULTS.grade;
      typeSelect.value = DEFAULTS.type;
      countInput.value = DEFAULTS.count;
      difficultySelect.value = DEFAULTS.difficulty;
      linesSelect.value = String(DEFAULTS.lines);
      titleInput.value = DEFAULTS.title;
      answersToggle.input.checked = DEFAULTS.answers;
      nameToggle.input.checked = DEFAULTS.showName;
      responseBox.value = "";
      sheetWrap.innerHTML = "";
      stub.hidden = false;
      tools.hidden = true;
      ui.clearErrors(form);
      setStatus("", false);
      updatePrompt();
      App.storage.remove(STORAGE_KEY);
    }

    form.addEventListener("input", function () {
      updatePrompt();
    });

    form.addEventListener("change", function () {
      updatePrompt();
    });

    copyBtn.addEventListener("click", function () {
      if (!readValidTopic()) return;
      saveState();
      copyText(promptBox.value, promptBox).then(function (copied) {
        setStatus(copied ? t("ai.statusCopied") : t("ai.statusCopyError"), !copied);
      });
    });

    openBtn.addEventListener("click", function () {
      if (!readValidTopic()) return;
      saveState();
      window.open(CHATGPT_URL, "_blank", "noopener");
      copyText(promptBox.value, promptBox).then(function (copied) {
        setStatus(copied ? t("ai.statusCopied") : t("ai.statusCopyError"), !copied);
      });
    });

    buildBtn.addEventListener("click", function () {
      createSheet(true);
    });

    clearBtn.addEventListener("click", clearAll);

    printBtn.addEventListener("click", function () {
      window.print();
    });

    updatePrompt();
    responseBox.value = saved.response || "";
    if (responseBox.value.trim()) {
      createSheet(false);
    }
  }

  App.aiPage = {
    render: render,
    buildPrompt: buildPrompt,
    parseResponse: parseResponse
  };
})();
