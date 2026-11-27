/**
 * Avis Vérifiés reviews widget. Static rating badge for the demo; replace with the
 * Skeepers / Avis Vérifiés script integration (consent-gated) for live reviews.
 * @param {Element} widget the widget element
 */
export default function decorate(widget) {
  widget.querySelector('a')?.setAttribute('aria-label', widget.querySelector('img')?.alt || 'Avis Vérifiés');
}
