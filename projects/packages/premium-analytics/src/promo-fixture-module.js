const { createElement: h } = window.React;

/**
 * Content of the fixture settings promo, to exercise the render module tier.
 *
 * @param {object}   props            - The render props.
 * @param {object}   props.promo      - The promo record.
 * @param {Function} props.trackClick - Records a click, by label.
 * @return {object} The element.
 */
export default function PromoFixtureModule( { promo, trackClick } ) {
	return h(
		'div',
		null,
		h( 'h3', null, promo.title ),
		h( 'p', null, promo.description ),
		h(
			'a',
			{
				href: promo.cta_url,
				target: '_blank',
				rel: 'noopener noreferrer',
				onClick: () => trackClick( 'fixture-cta' ),
			},
			promo.cta_label
		)
	);
}
