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

	it( 'drops the unit slot when the row has no metric name', () => {
		expect( formatTooltipPointLabel( '86', undefined, 'September 17, 2026' ) ).toBe(
			'86 · September 17, 2026'
		);
	} );
} );
