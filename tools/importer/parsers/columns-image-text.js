/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-image-text.
 * Source: .cms-double-colonnes (figure.cms-image + .cms-double-colonnes__content).
 * Output: one row -> [image cell, text cell] (cell order follows source order).
 */
export default function parse(element, { document }) {
  const figure = element.querySelector(':scope > figure.cms-image, :scope > .cms-image');
  const content = element.querySelector(':scope > .cms-double-colonnes__content');

  // image cell
  const imageCell = [];
  const srcImg = figure ? figure.querySelector('img') : null;
  if (srcImg) {
    const img = document.createElement('img');
    img.src = srcImg.getAttribute('src') || srcImg.getAttribute('data-src') || '';
    img.alt = srcImg.getAttribute('alt') || '';
    imageCell.push(img);
  }

  // text cell: heading, wysiwyg text, button links
  const textCell = [];
  if (content) {
    const heading = content.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
    if (heading) textCell.push(heading);

    const wysiwyg = content.querySelector(':scope > .cms-wysiwyg');
    if (wysiwyg) {
      [...wysiwyg.children].forEach((child) => textCell.push(child));
    }

    const buttons = content.querySelectorAll('.cms-double-colonnes__buttons a[href]');
    buttons.forEach((btn) => {
      const a = document.createElement('a');
      a.href = btn.getAttribute('href');
      a.textContent = btn.textContent.trim();
      const strong = document.createElement('strong');
      strong.append(a);
      const p = document.createElement('p');
      p.append(strong);
      textCell.push(p);
    });
  }

  // keep source column order (image may come after the text)
  const imageFirst = !figure || !content
    || !!(figure.compareDocumentPosition(content) & 4 /* DOCUMENT_POSITION_FOLLOWING */);
  const row = imageFirst ? [imageCell, textCell] : [textCell, imageCell];

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-image-text', cells });
  element.replaceWith(block);
}
