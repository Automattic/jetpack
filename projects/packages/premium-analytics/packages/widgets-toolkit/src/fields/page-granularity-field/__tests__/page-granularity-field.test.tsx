/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
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

type Attributes = { granularity?: string; reportParams?: Record< string, unknown > };

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

describe( 'PageGranularityField', () => {
	it( 'names the stored bucket when there is one', () => {
		expect( groupByControl( { granularity: 'week' } ) ).toHaveTextContent( 'By weeks' );
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

	// The widget body already ignores a bucket it no longer offers. The control has
	// to agree, or a layout saved with `auto` shows `By hours` over a chart drawing
	// whatever the page implies.
	it( 'ignores a stored bucket it no longer offers, as the chart does', () => {
		const control = groupByControl( {
			granularity: 'auto',
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
