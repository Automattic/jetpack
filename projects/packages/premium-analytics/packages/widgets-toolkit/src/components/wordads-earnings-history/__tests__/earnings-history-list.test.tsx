/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { EarningsHistoryList } from '../earnings-history-list';
import type { EarningsHistoryRow } from '../fields';

// Oldest first, so only the list's own sort can put September on top.
const ROWS: EarningsHistoryRow[] = [ '2026-07', '2026-08', '2026-09' ].map( period => ( {
	id: period,
	period,
	amount: 10,
	pageviews: 0,
	status: 1,
} ) );

const originalGetRect = Element.prototype.getBoundingClientRect;

// jsdom lays nothing out, so the list root and its rows report these heights.
function stubHeights( root: number, row: number ) {
	Element.prototype.getBoundingClientRect = function () {
		if ( this.tagName === 'LI' ) {
			return { width: 0, height: row } as DOMRect;
		}
		// eslint-disable-next-line testing-library/no-node-access -- Identifying the measured root requires a DOM query.
		if ( this.querySelector( ':scope > ul' ) ) {
			return { width: 0, height: root } as DOMRect;
		}
		return originalGetRect.call( this );
	};
}

// Hidden rows leave the accessibility tree, so these are the periods on screen, in order.
const visiblePeriods = () =>
	screen
		.getAllByRole( 'listitem' )
		.map( item => item.textContent?.match( /^\D+ \d{4}/ )?.[ 0 ] ?? '' );

describe( 'EarningsHistoryList', () => {
	afterEach( () => {
		Element.prototype.getBoundingClientRect = originalGetRect;
	} );

	it( 'lists the newest periods first, as many as fit whole', () => {
		stubHeights( 100, 36 );
		render( <EarningsHistoryList rows={ ROWS } /> );

		expect( visiblePeriods() ).toEqual( [ 'September 2026', 'August 2026' ] );
	} );

	it( 'keeps one row visible when not even one fits whole', () => {
		stubHeights( 20, 36 );
		render( <EarningsHistoryList rows={ ROWS } /> );

		expect( visiblePeriods() ).toEqual( [ 'September 2026' ] );
	} );

	it( 'renders each status as a badge, with a pending reason in an info button', () => {
		stubHeights( 200, 36 );
		render( <EarningsHistoryList rows={ [ ...ROWS, { ...ROWS[ 0 ], id: 'p', status: 3 } ] } /> );

		expect( screen.getAllByText( 'Paid' ) ).toHaveLength( 3 );
		expect( screen.getByText( 'Pending' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Missing tax info' } ) ).toBeInTheDocument();
	} );
} );
