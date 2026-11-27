/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget (Avis Verifies customer reviews).
 * The scraped review texts are NOT imported: the reviews are rendered at runtime
 * by the widget block, which loads /widgets/avis-verifies.html/.css/.js.
 * Output: a single cell containing a link to the widget HTML file.
 */
export default function parse(element, { document }) {
  const a = document.createElement('a');
  a.href = '/widgets/avis-verifies.html';
  a.textContent = '/widgets/avis-verifies.html';

  const cells = [[a]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'widget', cells });
  element.replaceWith(block);
}
