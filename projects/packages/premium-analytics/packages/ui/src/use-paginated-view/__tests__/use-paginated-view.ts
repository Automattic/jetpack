/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { usePaginatedView } from '../use-paginated-view';
import type { Field, View } from '@jetpack-premium-analytics/externals';

interface Row {
	id: string;
	label: string;
}

const FIELDS: Field< Row >[] = [
	{ id: 'label', label: 'Label', getValue: ( { item }: { item: Row } ) => item.label },
];

/**
 * Rows labelled `Row 1`…`Row n`.
 *
 * @param count - How many to build.
 * @return The rows.
 */
function rows( count: number ): Row[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
	} ) );
}

/**
 * A table view sitting on one page, ten rows at a time.
 *
 * @param page - The page the reader is on.
 * @return The view.
 */
function viewOnPage( page: number ): View {
	return { type: 'table', page, perPage: 10, search: '', fields: [ 'label' ] } as View;
}

/**
 * Render `usePaginatedView` over one data set and view.
 *
 * @param data - The rows.
 * @param view - The view.
 * @return The hook result.
 */
function paginate( data: Row[], view: View ) {
	return renderHook( () => usePaginatedView< Row >( data, view, FIELDS ) ).result.current;
}

describe( 'usePaginatedView', () => {
	it( 'leaves a page that is still in range alone', () => {
		const view = viewOnPage( 2 );
		const result = paginate( rows( 25 ), view );

		expect( result.view ).toBe( view );
		expect( result.data.map( row => row.label ) ).toEqual( [
			'Row 11',
			'Row 12',
			'Row 13',
			'Row 14',
			'Row 15',
			'Row 16',
			'Row 17',
			'Row 18',
			'Row 19',
			'Row 20',
		] );
	} );

	it( 'falls back to the last page when the page is past the end', () => {
		const result = paginate( rows( 8 ), viewOnPage( 3 ) );

		expect( result.data.map( row => row.label ) ).toEqual( [
			'Row 1',
			'Row 2',
			'Row 3',
			'Row 4',
			'Row 5',
			'Row 6',
			'Row 7',
			'Row 8',
		] );
	} );

	it( 'hands back the clamped view, not just the rows', () => {
		// DataViews reads `view.page` for its own controls, so a caller given only
		// the rows would show page 3 above page 2's rows.
		const result = paginate( rows( 12 ), viewOnPage( 3 ) );

		expect( result.view.page ).toBe( 2 );
		expect( result.data.map( row => row.label ) ).toEqual( [ 'Row 11', 'Row 12' ] );
		expect( result.paginationInfo ).toEqual( { totalItems: 12, totalPages: 2 } );
	} );

	it( 'clamps to the first page when there is nothing to show', () => {
		const result = paginate( [], viewOnPage( 3 ) );

		expect( result.view.page ).toBe( 1 );
		expect( result.data ).toEqual( [] );
	} );
} );
