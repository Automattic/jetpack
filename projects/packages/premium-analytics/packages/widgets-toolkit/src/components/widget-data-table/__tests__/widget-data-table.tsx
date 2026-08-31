/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
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

describe( 'WidgetDataTable', () => {
	it( 'falls back to the last page when a refetch leaves the current one out of range', () => {
		// The table's page survives a refetch now that `WidgetState` keeps its
		// children mounted, so a smaller result can strand the reader past the
		// end. DataViews slices blindly and hides its pagination once a single
		// page is left, which would leave a blank table and no way back.
		const { rerender } = render(
			<WidgetDataTable< Row >
				data={ rows( 25 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /next page/i } ) );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender(
			<WidgetDataTable< Row >
				data={ rows( 8 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 8' ) ).toBeInTheDocument();
	} );

	it( 'keeps the pagination controls agreeing with the rows it fell back to', () => {
		// Shrinking to two pages rather than one, so the footer stays on screen.
		// DataViews reads `view.page` for its own controls, so clamping only the
		// slice would show "page 1" above page 2's rows, with a Previous button
		// that appears to do nothing.
		const { rerender } = render(
			<WidgetDataTable< Row >
				data={ rows( 25 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		const next = screen.getByRole( 'button', { name: /next page/i } );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( next );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( next );
		expect( screen.getByText( 'Row 21' ) ).toBeInTheDocument();

		rerender(
			<WidgetDataTable< Row >
				data={ rows( 12 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveValue( '2' );
	} );

	it( 'leaves a page that is still in range alone', () => {
		const { rerender } = render(
			<WidgetDataTable< Row >
				data={ rows( 25 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /next page/i } ) );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender(
			<WidgetDataTable< Row >
				data={ rows( 22 ) }
				fields={ FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
			/>
		);

		// Page 2 still exists, so the reader stays on it.
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 1' ) ).not.toBeInTheDocument();
	} );
} );
