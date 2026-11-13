(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;

  const PER_PAGE = 12;

  let readFields = null;

  function makeSample(lines, fontPt) {
    const sample = el("div", "copy-sample");
    sample.style.fontSize = fontPt + "pt";
    sample.textContent = lines.join("\n");
    return sample;
  }

  function makeWriteZone(slant, watermark) {
    const zone = el("div", "write-zone" + (slant ? " slant" : ""));
    if (watermark) {
      const mark = el("span", "watermark", t("copy.watermark"));
      mark.setAttribute("aria-hidden", "true");
      zone.appendChild(mark);
    }
    return zone;
  }

  App.generators.L1 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const textInput = el("textarea");
      textInput.value = opts.text !== undefined ? opts.text : t("l1.sample");
      container.appendChild(ui.field(t("form.text"), textInput, t("form.textHint")));

      const style = ui.select(
        [
          ["slant", t("style.slant")],
          ["plain", t("style.plain")]
        ],
        opts.lineStyle || "slant"
      );
      container.appendChild(ui.field(t("form.lineStyle"), style));

      const extraInput = el("input");
      extraInput.type = "text";
      extraInput.value = opts.extraTask || "";
      container.appendChild(ui.field(t("form.extraTask"), extraInput, t("form.extraTaskHint")));

      const watermark = ui.checkbox(t("form.watermark"), !!opts.watermark);
      container.appendChild(watermark.label);

      readFields = function () {
        ui.clearErrors(container);
        const text = textInput.value.replace(/\r/g, "").replace(/\n+$/, "");
        if (!text.trim()) {
          ui.setError(textInput, t("err.text"));
          return null;
        }
        return {
          text,
          lineStyle: style.value,
          extraTask: extraInput.value.trim(),
          watermark: watermark.input.checked
        };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts) {
      const raw = opts.text.replace(/\r/g, "").split("\n");
      while (raw.length && raw[0].trim() === "") raw.shift();
      while (raw.length && raw[raw.length - 1].trim() === "") raw.pop();
      const lines = raw.length ? raw : [t("l1.sample")];
      const maxLen = lines.reduce(function (max, line) {
        return Math.max(max, line.length);
      }, 1);
      const fontPt = Math.max(9, Math.min(16, Math.floor(1020 / maxLen)));

      const pages = [];
      for (let start = 0; start < lines.length; start += PER_PAGE) {
        const chunk = lines.slice(start, start + PER_PAGE);
        const body = el("div", "copy-body");
        body.appendChild(makeSample(chunk, fontPt));
        body.appendChild(
          makeWriteZone(opts.lineStyle === "slant", opts.watermark)
        );
        if (opts.extraTask && start + PER_PAGE >= lines.length) {
          body.appendChild(el("div", "copy-extra", t("copy.extra") + opts.extraTask));
        }
        pages.push(body);
      }

      return { pages, answers: null, fill: true };
    }
  };
})();
