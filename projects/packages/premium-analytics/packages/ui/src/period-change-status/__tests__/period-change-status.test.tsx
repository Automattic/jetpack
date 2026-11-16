/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { configure, render, screen, within } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { PeriodChangeStatus } from '../period-change-status';

configure( { reactStrictMode: true } );

const JULY_2026 = {
	from: new TZDate( 2026, 6, 1, 0, 0, 0, 0, 'UTC' ),
	to: new TZDate( 2026, 6, 31, 23, 59, 59, 999, 'UTC' ),
};

const sentence = () => within( screen.getByRole( 'status' ) ).getByText( /Date range updated/ );

describe( 'PeriodChangeStatus', () => {
	it( 'mounts an empty status region before anything happens', () => {
		render( <PeriodChangeStatus /> );

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'announces the period a widget set', () => {
		render( <PeriodChangeStatus periodChange={ { id: 1, range: JULY_2026 } } /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Date range updated to July 2026.' );
	} );

	it( 'inserts a new node for a repeat of the same sentence', () => {
		const view = render( <PeriodChangeStatus periodChange={ { id: 1, range: JULY_2026 } } /> );
		const first = sentence();

		view.rerender( <PeriodChangeStatus periodChange={ { id: 2, range: JULY_2026 } } /> );

		expect( sentence() ).toHaveTextContent( 'Date range updated to July 2026.' );
		expect( sentence() ).not.toBe( first );
	} );

	it( 'empties the region when the attention is let go', () => {
		const view = render( <PeriodChangeStatus periodChange={ { id: 1, range: JULY_2026 } } /> );

		view.rerender( <PeriodChangeStatus /> );

		expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );
} );
