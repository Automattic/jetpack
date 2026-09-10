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

/** Rows labelled `Row 1`…`Row n`. */
function rows( count: number ): Row[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
	} ) );
}

/** A table view sitting on one page, ten rows at a time. */
function viewOnPage( page: number ): View {
	return { type: 'table', page, perPage: 10, search: '', fields: [ 'label' ] } as View;
}

/** Render the hook over a data set that can change under it, as a refetch would. */
function renderPaginated( data: Row[], view: View, setView = jest.fn() ) {
	const utils = renderHook(
		( props: { data: Row[]; view: View } ) =>
			usePaginatedView< Row >( props.data, props.view, FIELDS, setView ),
		{ initialProps: { data, view } }
	);

	return { ...utils, setView };
}

const labels = ( data: Row[] ) => data.map( row => row.label );

describe( 'usePaginatedView', () => {
	it( 'leaves a page that is still in range alone', () => {
		const view = viewOnPage( 2 );
		const { result, setView } = renderPaginated( rows( 25 ), view );

		expect( result.current.view ).toBe( view );
		expect( labels( result.current.data ) ).toEqual( [
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
		expect( setView ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the last page when the data shrinks under it', () => {
		const { result, rerender } = renderPaginated( rows( 25 ), viewOnPage( 3 ) );

		expect( labels( result.current.data ) ).toEqual( [
			'Row 21',
			'Row 22',
			'Row 23',
			'Row 24',
			'Row 25',
		] );

		rerender( { data: rows( 8 ), view: viewOnPage( 3 ) } );

		expect( result.current.view.page ).toBe( 1 );
		expect( labels( result.current.data ) ).toEqual( [
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
		const { result } = renderPaginated( rows( 12 ), viewOnPage( 3 ) );

		expect( result.current.view.page ).toBe( 2 );
		expect( labels( result.current.data ) ).toEqual( [ 'Row 11', 'Row 12' ] );
		expect( result.current.paginationInfo ).toEqual( { totalItems: 12, totalPages: 2 } );
	} );

	it( 'writes the clamped view back, so a stale page cannot come back later', () => {
		const { setView } = renderPaginated( rows( 12 ), viewOnPage( 3 ) );

		expect( setView ).toHaveBeenCalledWith( expect.objectContaining( { page: 2 } ) );
	} );

	it( 'clamps to the first page when there is nothing to show', () => {
		const { result } = renderPaginated( [], viewOnPage( 3 ) );

		expect( result.current.view.page ).toBe( 1 );
		expect( result.current.data ).toEqual( [] );
	} );

	it( 'keeps the reader on the last page when it shrinks to exactly that many', () => {
		// 21 rows is still three pages, so page 3 holds one row and must not clamp.
		const { result: inRange, setView } = renderPaginated( rows( 21 ), viewOnPage( 3 ) );
		expect( labels( inRange.current.data ) ).toEqual( [ 'Row 21' ] );
		expect( setView ).not.toHaveBeenCalled();

		// 20 rows is two pages, so page 3 is one past the end.
		const { result: clamped } = renderPaginated( rows( 20 ), viewOnPage( 3 ) );
		expect( clamped.current.view.page ).toBe( 2 );
	} );
} );
