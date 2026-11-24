/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import DataViewsWidget, { type DataViewsAttributes } from '../render';
import type { DataViewsSource } from '../sources/types';
import type { Field } from '@jetpack-premium-analytics/externals';

interface Row {
	id: string;
	label: string;
	views: number;
}

const FIELDS: Field< Row >[] = [
	{ id: 'label', label: 'Label', getValue: ( { item }: { item: Row } ) => item.label },
	{ id: 'views', label: 'Views', getValue: ( { item }: { item: Row } ) => item.views },
];

let mockRows: Row[] = [];
const mockPageItems = jest.fn();

const mockSource: DataViewsSource< Row > = {
	getItemId: item => item.id,
	useRecords: ( { pageItems } ) => {
		mockPageItems( pageItems.map( item => item.label ) );

		return { data: mockRows, fields: FIELDS, isLoading: false, isError: false };
	},
};

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../sources', () => ( {
	getDataViewsSource: ( name?: string ) => ( name === 'test/rows' ? mockSource : undefined ),
} ) );

/** Rows labelled `Row 1`…`Row n`, each with one more view than the one before. */
function rows( count: number ): Row[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
		views: index + 1,
	} ) );
}

const reportParams = getDefaultQueryParams();

const widget = ( view?: DataViewsAttributes[ 'view' ] ) => (
	<DataViewsWidget attributes={ { source: 'test/rows', view, reportParams } } />
);

const goToPage = async ( user: ReturnType< typeof userEvent.setup >, page: number ) => {
	for ( let step = 1; step < page; step++ ) {
		await user.click( screen.getByRole( 'button', { name: /next page/i } ) );
	}
};

describe( 'DataViewsWidget', () => {
	afterEach( () => {
		mockPageItems.mockClear();
	} );

	it( 'shows the rows of the source it names, in the view it carries', () => {
		mockRows = rows( 3 );

		render(
			widget( {
				titleField: 'label',
				fields: [ 'views' ],
				sort: { field: 'views', direction: 'desc' },
			} )
		);

		expect( screen.getAllByText( /^Row \d$/ ).map( row => row.textContent ) ).toEqual( [
			'Row 3',
			'Row 2',
			'Row 1',
		] );
	} );

	it( 'hands the source the rows on screen', async () => {
		const user = userEvent.setup();
		mockRows = rows( 25 );
		render( widget() );

		await goToPage( user, 3 );

		expect( mockPageItems ).toHaveBeenLastCalledWith( [
			'Row 21',
			'Row 22',
			'Row 23',
			'Row 24',
			'Row 25',
		] );
	} );

	it( 'keeps the pagination controls agreeing with the rows it fell back to', async () => {
		// Shrinking to two pages rather than one, so the footer stays on screen.
		const user = userEvent.setup();
		mockRows = rows( 25 );
		const { rerender } = render( widget() );

		await goToPage( user, 3 );
		expect( screen.getByText( 'Row 21' ) ).toBeInTheDocument();

		mockRows = rows( 12 );
		rerender( widget() );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveTextContent( '2' );
	} );
} );
