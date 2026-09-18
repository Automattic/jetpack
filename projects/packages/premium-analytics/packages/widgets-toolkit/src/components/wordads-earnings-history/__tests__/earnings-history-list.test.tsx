/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useElementSize } from '../../../hooks/use-element-size';
import { EarningsHistoryList } from '../earnings-history-list';
import type { EarningsHistoryRow } from '../fields';

jest.mock( '../../../hooks/use-element-size' );

const mockUseElementSize = jest.mocked( useElementSize );

const ROWS: EarningsHistoryRow[] = [ '2026-07', '2026-08', '2026-09' ].map( period => ( {
	id: period,
	period,
	amount: 10,
	pageviews: 0,
	status: 1,
} ) );

// jsdom lays nothing out; the list measures its root first and its first row second.
function mockSizes( root: number, row: number ) {
	let call = 0;
	mockUseElementSize.mockImplementation(
		() =>
			[ jest.fn(), { width: 0, height: call++ % 2 === 0 ? root : row } ] as ReturnType<
				typeof useElementSize
			>
	);
}

const hiddenFlags = () =>
	screen.getAllByRole( 'listitem', { hidden: true } ).map( item => item.hidden );

describe( 'EarningsHistoryList', () => {
	it( 'hides the rows that do not fit whole', () => {
		mockSizes( 100, 36 );
		render( <EarningsHistoryList rows={ ROWS } /> );

		expect( hiddenFlags() ).toEqual( [ false, false, true ] );
	} );

	it( 'keeps one row visible when not even one fits whole', () => {
		mockSizes( 20, 36 );
		render( <EarningsHistoryList rows={ ROWS } /> );

		expect( hiddenFlags() ).toEqual( [ false, true, true ] );
	} );
} );
