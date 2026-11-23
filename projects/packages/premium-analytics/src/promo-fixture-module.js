import { PromoCta } from '@automattic/jetpack-premium-analytics-sdk';

if ( ! window.React ) {
	throw new Error( 'promo-fixture: window.React is missing, so the render module cannot draw.' );
}

const h = window.React.createElement;

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
		{ 'data-testid': 'promo-fixture-module' },
		h( 'h3', null, promo.title ),
		h( 'p', null, promo.description ),
		h( PromoCta, { href: promo.cta_url, label: promo.cta_label, trackClick } )
	);
}
