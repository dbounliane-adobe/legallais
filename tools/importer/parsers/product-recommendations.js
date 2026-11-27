/* eslint-disable */
/* global WebImporter */
/**
 * Parser for product-recommendations.
 * Commerce-driven: scraped product tiles are NOT imported. Products are loaded
 * at runtime by the Adobe Commerce recommendations dropin. Only the config
 * table is output.
 */
export default function parse(element, { document }) {
  const cells = [
    ['recId', 'cf042e53-7efb-4a7e-b1bd-4f87d5c6ca84'],
    // The demo unit is a "viewed-viewed" type: on the homepage it needs an anchor SKU
    // (no product context). Authors can change it or remove it once a homepage unit exists.
    ['currentSku', 'ADB406'],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'product-recommendations', cells });
  element.replaceWith(block);
}
