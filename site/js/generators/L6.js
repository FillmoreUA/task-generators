(function () {
  const App = window.App;
  const ui = App.ui;
  const t = App.i18n.t.bind(App.i18n);
  const el = ui.el;
  let readFields = null;

  App.generators.L6 = {
    buildForm(container, saved) {
      const opts = saved || {};

      const nameInput = el("input");
      nameInput.type = "text";
      nameInput.value = opts.name !== undefined ? opts.name : "Олена";
      container.appendChild(ui.field(t("form.childName"), nameInput));

      const rows = ui.numberInput(opts.rows !== undefined ? opts.rows : 8, 1, 14, 1);
      container.appendChild(ui.field(t("form.rows"), rows));

      const size = App.propysi.sizeSelect(opts.size);
      container.appendChild(ui.field(t("form.size"), size));

      const fontType = ui.select(
        [
          ["hand", t("font.hand")],
          ["print", t("font.print")]
        ],
        opts.fontType || "hand"
      );
      container.appendChild(ui.field(t("form.fontType"), fontType));

      readFields = function () {
        ui.clearErrors(container);
        const name = nameInput.value.trim();
        if (!name) {
          ui.setError(nameInput, t("err.name"));
          return null;
        }
        const count = App.math.int(rows);
        if (count === null || count < 1 || count > 14) {
          ui.setError(rows, t("err.rows"));
          return null;
        }
        return { name, rows: count, size: size.value, fontType: fontType.value };
      };
    },

    read() {
      return readFields ? readFields() : null;
    },

    render(opts) {
      const preset = App.propysi.SIZES[opts.size] || App.propysi.SIZES.normal;
      const total = Math.min(opts.rows, preset.rows);
      const segments = App.propysi.parseLine(opts.name);
      const nameRows = Math.max(1, total - 2);
      const descriptors = [];

      for (let i = 0; i < nameRows; i++) {
        descriptors.push({ segments, dashed: true });
      }
      while (descriptors.length < total) descriptors.push(null);

      return {
        body: App.propysi.buildRows(descriptors, {
          fontSize: preset.fontSize,
          fontClass: opts.fontType === "print" ? "print" : "hand",
          slant: true
        })
      };
    }
  };
})();
