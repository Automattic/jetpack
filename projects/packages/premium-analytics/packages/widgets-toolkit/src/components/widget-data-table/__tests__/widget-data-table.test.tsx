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

const table = ( count: number ) => (
	<WidgetDataTable< Row >
		data={ rows( count ) }
		fields={ FIELDS }
		getItemId={ item => item.id }
		perPageSizes={ [ 10 ] }
	/>
);

const goToPage = async ( user: ReturnType< typeof userEvent.setup >, page: number ) => {
	for ( let step = 1; step < page; step++ ) {
		await user.click( screen.getByRole( 'button', { name: /next page/i } ) );
	}
};

describe( 'WidgetDataTable', () => {
	it( 'falls back to the last page when a refetch leaves the current one out of range', async () => {
		// The table's page survives a refetch now that `WidgetState` keeps its
		// children mounted, so a smaller result can strand the reader past the
		// end. DataViews slices blindly and hides its pagination once a single
		// page is left, which would leave a blank table and no way back.
		const user = userEvent.setup();
		const { rerender } = render( table( 25 ) );

		await goToPage( user, 2 );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender( table( 8 ) );

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 8' ) ).toBeInTheDocument();
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
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveValue( '2' );
	} );

	it( 'takes the reader forward from the page it fell back to, not the stale one', async () => {
		const user = userEvent.setup();
		const { rerender } = render( table( 25 ) );

		await goToPage( user, 3 );
		rerender( table( 12 ) );

		await user.click( screen.getByRole( 'button', { name: /previous page/i } ) );

		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveValue( '1' );
		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
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
