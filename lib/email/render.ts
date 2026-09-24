export type TemplateFields = Record<string, string>;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fillPlain(template: string, fields: TemplateFields) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => fields[key] ?? match);
}

export function brandedHtml(houseName: string, body: string) {
  const paragraphs = escapeHtml(body)
    .split("\n")
    .map((line) => (line.trim() ? `<p style="margin:0 0 12px">${line}</p>` : "<br/>"))
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#fef9ee;color:#1d1c15;font-family:'Space Grotesk',system-ui,sans-serif">
  <div style="background:#980012;color:#fef9ee;padding:20px 24px;font-weight:700">${escapeHtml(houseName)}</div>
  <div style="padding:24px;max-width:560px">${paragraphs}</div>
</body></html>`;
}

export function fillAndRender(houseName: string, template: string, fields: TemplateFields) {
  const escaped: TemplateFields = {};
  for (const [key, value] of Object.entries(fields)) escaped[key] = escapeHtml(value);
  const plain = fillPlain(template, fields);
  return { plain, html: brandedHtml(houseName, fillPlain(template, escaped)) };
}
