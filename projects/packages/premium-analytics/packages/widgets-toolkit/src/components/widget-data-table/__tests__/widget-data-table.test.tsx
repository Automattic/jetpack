/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { WidgetDataTable } from '../widget-data-table';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { ComponentProps } from 'react';

interface Row {
	id: string;
	label: string;
	views: number;
}

const FIELDS: Field< Row >[] = [
	{ id: 'label', label: 'Label', getValue: ( { item }: { item: Row } ) => item.label },
	{ id: 'views', label: 'Views', getValue: ( { item }: { item: Row } ) => item.views },
];

/** Rows labelled `Row 1`…`Row n`, each with one more view than the one before. */
function rows( count: number ): Row[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
		views: index + 1,
	} ) );
}

const table = (
	data: Row[] | number,
	props: Partial< ComponentProps< typeof WidgetDataTable< Row > > > = {}
) => (
	<WidgetDataTable< Row >
		data={ typeof data === 'number' ? rows( data ) : data }
		fields={ FIELDS }
		getItemId={ item => item.id }
		status={ { isLoading: false } }
		{ ...props }
	/>
);

const goToPage = async ( user: ReturnType< typeof userEvent.setup >, page: number ) => {
	for ( let step = 1; step < page; step++ ) {
		await user.click( screen.getByRole( 'button', { name: /next page/i } ) );
	}
};

describe( 'WidgetDataTable', () => {
	it( 'starts from the view it is given', () => {
		render(
			table( 3, {
				initialView: {
					titleField: 'label',
					fields: [ 'views' ],
					sort: { field: 'views', direction: 'desc' },
				},
			} )
		);

		expect( screen.getAllByText( /^Row \d$/ ).map( row => row.textContent ) ).toEqual( [
			'Row 3',
			'Row 2',
			'Row 1',
		] );
	} );

	it( 'sorts a column from its header button, toggling the direction', async () => {
		const user = userEvent.setup();
		const shownRows = () => screen.getAllByText( /^Row \d$/ ).map( row => row.textContent );
		render( table( 3, { initialView: { titleField: 'label', fields: [ 'views' ] } } ) );

		await user.click( screen.getByRole( 'button', { name: 'Views' } ) );
		expect( shownRows() ).toEqual( [ 'Row 3', 'Row 2', 'Row 1' ] );
		expect( screen.getByRole( 'columnheader', { name: 'Views' } ) ).toHaveAttribute(
			'aria-sort',
			'descending'
		);

		await user.click( screen.getByRole( 'button', { name: 'Views' } ) );
		expect( shownRows() ).toEqual( [ 'Row 1', 'Row 2', 'Row 3' ] );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );

	it( 'reports the rows on screen once per change', async () => {
		const user = userEvent.setup();
		const data = rows( 25 );
		const onChangePageItems = jest.fn();
		const { rerender } = render( table( data, { onChangePageItems } ) );

		await goToPage( user, 3 );
		// The same rows in a new array, as a widget's fields changing would produce.
		rerender( table( [ ...data ], { onChangePageItems } ) );

		expect( onChangePageItems.mock.calls.map( ( [ items ] ) => items[ 0 ].label ) ).toEqual( [
			'Row 1',
			'Row 11',
			'Row 21',
		] );
	} );

	it( 'keeps the pagination controls agreeing with the rows it fell back to', async () => {
		// Shrinking to two pages rather than one, so the footer stays on screen.
		// DataViews reads `view.page` for its own controls, so clamping only the
		// slice would show "page 1" above page 2's rows, with a Previous button
		// that appears to do nothing.
		const user = userEvent.setup();
		const { rerender } = render( table( 25 ) );

		await goToPage( user, 3 );
		expect( screen.getByText( 'Row 21' ) ).toBeInTheDocument();

		rerender( table( 12 ) );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveTextContent( '2' );
	} );

	it( 'stays where it fell back to when a later result grows again', async () => {
		// Clamping only the rendered rows would leave the stored page at 3, and a
		// reader widening the range back would be thrown to rows they never asked
		// for — with no control to touch in between, since a single page hides the
		// pagination entirely.
		const user = userEvent.setup();
		const { rerender } = render( table( 25 ) );

		await goToPage( user, 3 );
		rerender( table( 8 ) );
		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();

		rerender( table( 25 ) );

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 21' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves a page that is still in range alone', async () => {
		const user = userEvent.setup();
		const { rerender } = render( table( 25 ) );

		await goToPage( user, 2 );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender( table( 22 ) );

		// Page 2 still exists, so the reader stays on it.
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 1' ) ).not.toBeInTheDocument();
	} );
} );
