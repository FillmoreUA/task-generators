(function () {
  const App = (window.App = window.App || {});

  function page(options) {
    const opts = options || {};
    const sheet = document.createElement("div");
    sheet.className = "sheet";

    const head = document.createElement("div");
    head.className = "sheet-head";

    if (opts.title) {
      const title = document.createElement("div");
      title.className = "sheet-title";
      title.textContent = opts.title;
      head.appendChild(title);
    }

    if (opts.showName) {
      const name = document.createElement("div");
      name.className = "sheet-name";
      const label = document.createElement("span");
      label.textContent = App.i18n.t("sheet.nameLabel");
      const line = document.createElement("span");
      line.className = "sheet-name-line";
      name.append(label, line);
      head.appendChild(name);
    }

    const body = document.createElement("div");
    body.className = "sheet-body";
    if (opts.body) body.appendChild(opts.body);

    const foot = document.createElement("div");
    foot.className = "sheet-foot";
    if (opts.footer) foot.textContent = opts.footer;

    sheet.append(head, body, foot);
    return sheet;
  }

  App.sheet = {
    page,
    render(container, options) {
      const opts = options || {};
      container.innerHTML = "";
      const bodies = opts.pages && opts.pages.length ? opts.pages : [opts.body];
      bodies.forEach(function (body) {
        container.appendChild(
          page({
            title: opts.title,
            showName: opts.showName,
            body: body,
            footer: opts.footer
          })
        );
      });

      if (opts.answers) {
        const answersBody = document.createElement("div");
        answersBody.className = "sheet-answers";
        if (opts.answersBody) answersBody.appendChild(opts.answersBody);
        container.appendChild(
          page({
            title: App.i18n.t("sheet.answers"),
            showName: false,
            body: answersBody,
            footer: opts.footer
          })
        );
      }
    }
  };
})();
