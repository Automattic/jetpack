/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DatedTooltip } from '../dated-tooltip';
import type { DatedTooltipModel, DatedTooltipRow } from '../dated-tooltip-model';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	Icon: ( { icon }: { icon: React.ReactElement } ) => <span data-testid="icon">{ icon }</span>,
	LineShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	RectShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	VisuallyHidden: ( { children }: { children?: React.ReactNode } ) => <span>{ children }</span>,
} ) );

const views = ( count: number ) =>
	/* translators: %s: number of views. */
	_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' );

const row = ( overrides: Partial< DatedTooltipRow > ): DatedTooltipRow => ( {
	key: 'Views',
	name: 'Views',
	// Multipliers on, so a compact `130.9K` would show if the tooltip stopped spelling values out.
	dataFormat: { type: 'number', options: { useMultipliers: true } },
	indicator: { kind: 'series', style: { stroke: '#views' } },
	value: 130859,
	...overrides,
} );

function renderTooltip( model: Partial< DatedTooltipModel > ) {
	return render(
		<DatedTooltip
			model={ { date: 'September 18, 2026', rows: [ row( {} ) ], ...model } }
			indicatorType="line"
		/>
	);
}

/** The column headers, then each row's cells, as text. */
function cells(): string[][] {
	return screen
		.getAllByRole( 'row' )
		.map( tableRow => Array.from( tableRow.children ).map( cell => cell.textContent ?? '' ) );
}

describe( 'DatedTooltip', () => {
	it( 'heads the rows with the date once, and reads each as value then unit', () => {
		renderTooltip( {
			rows: [ row( {} ), row( { key: 'Visitors', name: 'Visitors', value: 67365 } ) ],
		} );

		expect( cells() ).toEqual( [
			[ 'September 18, 2026' ],
			[ '130,859 Views' ],
			[ '67,365 Visitors' ],
		] );
		expect( screen.getAllByTestId( 'swatch' ).map( el => el.dataset.fill ) ).toEqual( [
			'#views',
			'#views',
		] );
	} );

	it( 'sets the value apart from the unit, in the plural form the count calls for', () => {
		renderTooltip( { rows: [ row( { value: 1, countLabel: views } ) ] } );

		expect( screen.getByRole( 'rowheader' ) ).toHaveTextContent( '1 View' );
		// The value is its own element, so it can take its own weight.
		expect( screen.getByText( '1' ) ).not.toBe( screen.getByRole( 'rowheader' ) );
	} );

	it( 'draws an icon in place of the swatch for a row the chart does not draw', () => {
		renderTooltip( {
			rows: [ row( { indicator: { kind: 'icon', icon: <svg data-testid="eye" /> } } ) ],
		} );

		expect( screen.getByTestId( 'eye' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'swatch' ) ).not.toBeInTheDocument();
	} );

	it( 'reads a bucket with no reading as a dash, announced with the metric name', () => {
		renderTooltip( { rows: [ row( { value: null } ) ] } );

		expect( screen.getByRole( 'rowheader' ) ).toHaveTextContent( '— ViewsNo data for Views' );
	} );

	it( 'keeps a real zero as 0', () => {
		renderTooltip( { rows: [ row( { value: 0 } ) ] } );

		expect( screen.getByRole( 'rowheader' ) ).toHaveTextContent( '0 Views' );
	} );

	it( 'lists the comparison values in a second column under their own date, values only', () => {
		renderTooltip( {
			previousDate: 'September 18, 2025',
			rows: [
				row( {
					previous: {
						value: 98765,
						indicator: { kind: 'series', style: { stroke: '#views-previous' } },
					},
				} ),
				row( { key: 'Visitors', name: 'Visitors', value: 67365 } ),
			],
		} );

		expect( cells() ).toEqual( [
			[ 'September 18, 2026', 'September 18, 2025' ],
			[ '130,859 Views', '98,765' ],
			// Visitors has no comparison reading, so its cell reads as no data.
			[ '67,365 Visitors', '—No data' ],
		] );
		// Reading order: the Views row's two swatches, then the Visitors row's two; a
		// missing comparison keeps the row's own swatch beside its dash.
		expect( screen.getAllByTestId( 'swatch' ).map( el => el.dataset.fill ) ).toEqual( [
			'#views',
			'#views-previous',
			'#views',
			'#views',
		] );
	} );
} );
