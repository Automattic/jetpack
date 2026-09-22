/**
 * Internal dependencies
 */
import { formatTooltipPointLabel } from '../format-tooltip-point-label';

describe( 'formatTooltipPointLabel', () => {
	it( 'leads with the value, then the metric as its unit, then the date', () => {
		expect( formatTooltipPointLabel( '86', 'Views', 'September 17, 2026' ) ).toBe(
			'86 Views · September 17, 2026'
		);
	} );

	it( 'names the metric a bucket has no reading for', () => {
		expect( formatTooltipPointLabel( null, 'Subscribers', 'March 1, 2026' ) ).toBe(
			'No data for Subscribers · March 1, 2026'
		);
	} );
} );
