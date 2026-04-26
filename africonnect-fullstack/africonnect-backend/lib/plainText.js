/**
 * Convertit un contenu (évent. HTML) en texte sûr pour affichage plain-text.
 * Conserve les sauts de ligne approximatifs.
 */
function stripToPlainText(input) {
  let s = String(input || '');
  s = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  s = s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
  return s.trim();
}

module.exports = { stripToPlainText };
