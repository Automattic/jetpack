/**
 * External dependencies
 */
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatTooltipPointLabel } from '../format-tooltip-point-label';

const subscribers = ( count: number ) =>
	/* translators: %s: number of subscribers. */
	_n( '%s Subscriber', '%s Subscribers', count, 'jetpack-premium-analytics-pkg' );

describe( 'formatTooltipPointLabel', () => {
	it( 'leads with the value, then the metric as its unit, then the date', () => {
		expect( formatTooltipPointLabel( '86', 'Views', 'September 17, 2026' ) ).toBe(
			'86 Views · September 17, 2026'
		);
	} );

	it( "phrases a count with the plural form the count calls for, in place of the metric's name", () => {
		expect( formatTooltipPointLabel( '1', 'Subscribers', 'March 1, 2026', 1, subscribers ) ).toBe(
			'1 Subscriber · March 1, 2026'
		);
		expect(
			formatTooltipPointLabel( '1,204', 'Subscribers', 'March 1, 2026', 1204, subscribers )
		).toBe( '1,204 Subscribers · March 1, 2026' );
	} );
} );
