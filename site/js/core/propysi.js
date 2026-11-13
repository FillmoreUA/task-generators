(function () {
  const App = (window.App = window.App || {});
  const el = App.ui.el;
  const t = App.i18n.t.bind(App.i18n);
  const SVG_NS = "http://www.w3.org/2000/svg";

  const SIZES = {
    normal: { rows: 14, chars: 20, fontSize: 32 },
    medium: { rows: 7, chars: 17, fontSize: 52 },
    large: { rows: 4, chars: 11, fontSize: 82 }
  };

  function sizeSelect(value) {
    return App.ui.select(
      [
        ["normal", t("size.normal")],
        ["medium", t("size.medium")],
        ["large", t("size.large")]
      ],
      value || "normal"
    );
  }

  function parseLine(line) {
    const segments = [];
    const re = /(@[^@]*@|#[^#]*#)/g;
    let last = 0;
    let match;
    while ((match = re.exec(line))) {
      if (match.index > last) {
        segments.push({ text: line.slice(last, match.index), tone: "inherit" });
      }
      const raw = match[0];
      segments.push({ text: raw.slice(1, -1), tone: raw[0] === "@" ? "black" : "gray" });
      last = re.lastIndex;
    }
    if (last < line.length) {
      segments.push({ text: line.slice(last), tone: "inherit" });
    }
    return segments.filter(function (segment) {
      return segment.text.length > 0;
    });
  }

  function addText(svg, segments, opts, height) {
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "2");
    text.setAttribute("y", String(Math.round(height * 0.72)));
    text.setAttribute("font-size", String(opts.fontSize));
    text.setAttribute("class", "propysi-text " + (opts.fontClass || "hand"));
    text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");

    const total = segments.reduce(function (sum, segment) {
      return sum + segment.text.length;
    }, 0);
    if (total * opts.fontSize * 0.52 > 640) {
      text.setAttribute("textLength", "638");
      text.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }

    segments.forEach(function (segment) {
      const tspan = document.createElementNS(SVG_NS, "tspan");
      tspan.textContent = segment.text;
      if (segment.tone === "black") {
        tspan.setAttribute("fill", "#2b2a26");
        tspan.setAttribute("stroke", "none");
      } else if (segment.tone === "gray") {
        tspan.setAttribute("fill", "#a8a294");
        tspan.setAttribute("stroke", "none");
      } else if (opts.dashed) {
        tspan.setAttribute("fill", "none");
        tspan.setAttribute("stroke", "#9a9488");
        tspan.setAttribute("stroke-width", "1.2");
        tspan.setAttribute("stroke-dasharray", "2.5 2.5");
      } else {
        tspan.setAttribute("fill", "#2b2a26");
        tspan.setAttribute("stroke", "none");
      }
      text.appendChild(tspan);
    });

    svg.appendChild(text);
    return svg;
  }

  function row(segments, opts) {
    const height = Math.round(opts.fontSize * 1.7);
    const node = el("div", "propysi-row");
    node.style.height = height + "px";
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(height));
    svg.setAttribute("class", "propysi-svg");
    if (segments && segments.length) addText(svg, segments, opts, height);
    node.appendChild(svg);
    return node;
  }

  function buildRows(descriptors, opts) {
    const body = el("div", "propysi-body" + (opts.slant === false ? "" : " slant"));
    descriptors.forEach(function (descriptor) {
      const segments = descriptor ? descriptor.segments : [];
      body.appendChild(
        row(segments, {
          fontSize: opts.fontSize,
          fontClass: opts.fontClass,
          dashed: descriptor ? descriptor.dashed : false
        })
      );
    });
    return body;
  }

  function textArea(value, placeholder) {
    const input = el("textarea");
    input.value = value;
    if (placeholder) input.placeholder = placeholder;
    return input;
  }

  function lettersGenerator(id, config) {
    const cfg = config || {};
    let readFields = null;

    App.generators[id] = {
      buildForm(container, saved) {
        const opts = saved || {};
        const text = textArea(
          opts.text !== undefined ? opts.text : t(cfg.sampleKey),
          t("propysi.hint")
        );
        container.appendChild(App.ui.field(t("form.text"), text, t("propysi.hint")));

        const mode = App.ui.select(
          [
            ["self", t("mode.self")],
            ["repeatLetter", t("mode.repeatLetter")],
            ["repeatLine", t("mode.repeatLine")]
          ],
          opts.mode || "self"
        );
        container.appendChild(App.ui.field(t("form.mode"), mode));

        const size = sizeSelect(opts.size);
        container.appendChild(App.ui.field(t("form.size"), size));

        const language = App.ui.select(
          [
            ["UA", t("lang.ua")],
            ["RU", t("lang.ru")],
            ["EN", t("lang.en")]
          ],
          opts.language || "UA"
        );
        container.appendChild(App.ui.field(t("form.language"), language));

        readFields = function () {
          App.ui.clearErrors(container);
          const lines = text.value
            .replace(/\r/g, "")
            .split("\n")
            .map(function (line) {
              return line.trim();
            })
            .filter(Boolean);
          if (!lines.length) {
            App.ui.setError(text, t("err.text"));
            return null;
          }
          return {
            lines,
            mode: mode.value,
            size: size.value,
            language: language.value
          };
        };
      },

      read() {
        return readFields ? readFields() : null;
      },

      render(opts) {
        const preset = SIZES[opts.size] || SIZES.normal;
        const rows = [];

        if (opts.mode === "repeatLine") {
          const segments = parseLine(opts.lines[0] || "");
          for (let i = 0; i < preset.rows; i++) {
            rows.push({ segments, dashed: true });
          }
        } else if (opts.mode === "repeatLetter") {
          opts.lines.slice(0, preset.rows).forEach(function (line) {
            const plain = line.replace(/[@#]/g, "").replace(/\s+/g, "");
            const letter = plain.charAt(0) || "";
            const textValue = letter ? new Array(4).fill(letter).join("   ") : "";
            rows.push({ segments: [{ text: textValue, tone: "inherit" }], dashed: true });
          });
          while (rows.length < preset.rows) rows.push(null);
        } else {
          opts.lines.slice(0, preset.rows).forEach(function (line) {
            rows.push({ segments: parseLine(line), dashed: false });
          });
          while (rows.length < preset.rows) rows.push(null);
        }

        return {
          body: buildRows(rows, {
            fontSize: preset.fontSize,
            fontClass: cfg.fontClass,
            slant: true
          })
        };
      }
    };
  }

  App.propysi = {
    SIZES,
    sizeSelect,
    parseLine,
    row,
    buildRows,
    textArea,
    lettersGenerator
  };
})();
