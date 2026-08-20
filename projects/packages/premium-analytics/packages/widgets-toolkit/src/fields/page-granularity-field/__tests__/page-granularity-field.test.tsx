/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { granularityOptions } from '../../../helpers/chart-display-attribute-fields';
import PageGranularityField from '../page-granularity-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

jest.mock(
	'@wordpress/route',
	() => jest.requireActual( '../../../../../../tests/js/route-test-utils' ).mockWordPressRoute
);

type Attributes = {
	granularity?: string;
	granularityPickedFor?: string;
	reportParams?: Record< string, unknown >;
};

// The subset of the resolved field the select actually reads.
function fieldFor( values: Parameters< typeof granularityOptions >[ 0 ] ) {
	return {
		id: 'granularity',
		label: 'Group by',
		elements: granularityOptions( values ),
		getValue: ( { item }: { item: Attributes } ) => item.granularity,
		setValue: ( { item, value }: { item: Attributes; value: unknown } ) => ( {
			...item,
			granularity: value as string,
		} ),
		isDisabled: () => false,
	};
}

function groupByControl( data: Attributes ) {
	render(
		<PageGranularityField
			{ ...( {
				data,
				field: fieldFor( [ 'hour', 'day', 'week', 'month' ] ),
				onChange: jest.fn(),
			} as unknown as DataFormControlProps< Attributes > ) }
		/>
	);

	return screen.getByRole( 'combobox', { name: 'Group by' } );
}

/**
 * The buckets the control lists, in order.
 *
 * The select mounts its options only once opened, and `hidden: true` because in
 * jsdom, with no layout to position the popup against, it stays `hidden` even
 * then.
 *
 * @param control - The combobox to open.
 * @return The option labels.
 */
async function offeredBuckets( control: HTMLElement ): Promise< string[] > {
	await userEvent.click( control );

	return screen
		.getAllByRole( 'option', { hidden: true } )
		.map( option => option.textContent ?? '' );
}

describe( 'PageGranularityField', () => {
	it( "names a reader's pick while the page still resolves to what it was picked against", () => {
		// A 30-day range, which allows both the page's bucket and the picked one.
		const control = groupByControl( {
			granularity: 'week',
			granularityPickedFor: 'day',
			reportParams: { from: '2026-06-01', to: '2026-06-30', interval: 'day' },
		} );

		expect( control ).toHaveTextContent( 'By weeks' );
	} );

	// The range bounds the control, not just the chart: offering a bucket the
	// range cannot fill would let a reader pick one and get another.
	it( 'offers only the buckets the range can fill', async () => {
		const control = groupByControl( {
			reportParams: { from: '2026-06-01', to: '2026-06-30', interval: 'day' },
		} );

		await expect( offeredBuckets( control ) ).resolves.toEqual( [ 'By days', 'By weeks' ] );
	} );

	// Nothing this chart draws is coarse enough for a multi-year window, so the
	// control names the bucket the chart clamps to rather than emptying out.
	it( 'names the clamped bucket when the range outruns every option', async () => {
		const control = groupByControl( {
			reportParams: { from: '2020-01-01', to: '2026-06-30', interval: 'year' },
		} );

		await expect( offeredBuckets( control ) ).resolves.toEqual( [ 'By months' ] );
	} );

	// A pick the range no longer allows lapses, even though the page's own bucket
	// has not moved — otherwise it would outlive the range it was made for.
	it( 'lets a pick lapse once the range stops allowing it', () => {
		const control = groupByControl( {
			granularity: 'day',
			granularityPickedFor: 'month',
			reportParams: { from: '2025-01-01', to: '2026-06-30', interval: 'month' },
		} );

		expect( control ).toHaveTextContent( 'By months' );
	} );

	// The bug this guards: the control resolved the page's bucket from the URL
	// alone while the chart preferred `reportParams` from attributes, so a host
	// that injects them left the control naming one bucket over a chart drawing
	// another.
	it( 'falls back to the bucket the report params imply, not the first option', () => {
		const control = groupByControl( {
			reportParams: {
				from: '2026-06-15T00:00:00+00:00',
				to: '2026-06-15T23:59:59+00:00',
				interval: 'hour',
			},
		} );

		expect( control ).toHaveTextContent( 'By hours' );
	} );

	// The invariant: the chart resolves the same values through the same rule, so
	// a pick that has lapsed for one has lapsed for the other. Before this, the
	// chart forced the page's bucket on a fresh mount while the control still
	// showed the pick.
	it( 'lets a pick lapse once the page moves, exactly as the chart does', () => {
		const control = groupByControl( {
			granularity: 'day',
			granularityPickedFor: 'month',
			reportParams: { from: '2026-01-01', to: '2026-06-30', interval: 'week' },
		} );

		expect( control ).toHaveTextContent( 'By weeks' );
	} );

	// The widget body already ignores a bucket it no longer offers. The control has
	// to agree, or a layout saved with `auto` shows `By hours` over a chart drawing
	// whatever the page implies.
	it( 'ignores a stored bucket it no longer offers, as the chart does', () => {
		const control = groupByControl( {
			granularity: 'auto',
			granularityPickedFor: 'month',
			reportParams: { from: '2025-01-01', to: '2026-06-30', interval: 'month' },
		} );

		expect( control ).toHaveTextContent( 'By months' );
	} );

	it( 'resolves a coarser page interval the same way', () => {
		const control = groupByControl( {
			reportParams: { from: '2025-01-01', to: '2026-06-30', interval: 'month' },
		} );

		expect( control ).toHaveTextContent( 'By months' );
	} );
} );
