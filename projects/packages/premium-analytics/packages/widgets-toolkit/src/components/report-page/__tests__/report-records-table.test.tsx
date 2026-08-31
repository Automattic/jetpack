/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportRecordsTable } from '../report-records-table';
import type { Field, View } from '@jetpack-premium-analytics/externals';

interface Row {
	id: string;
	label: string;
	country: string;
	views: number;
}

const rows: Row[] = [
	{ id: 'in-mh', label: 'Maharashtra', country: 'IN', views: 6813 },
	{ id: 'us-tx', label: 'Texas', country: 'US', views: 4 },
];

const fields: Field< Row >[] = [
	{
		id: 'country',
		label: 'Country',
		elements: [
			{ value: 'IN', label: 'India' },
			{ value: 'US', label: 'United States' },
		],
		filterBy: { operators: [ 'is' ] },
		enableSorting: false,
		getValue: ( { item } ) => item.country,
	},
	{ id: 'label', label: 'Location', getValue: ( { item } ) => item.label },
	{ id: 'views', label: 'Views', getValue: ( { item } ) => item.views },
];

const INITIAL_VIEW: Partial< View > = { fields: [ 'label', 'views' ] };

const onChangeView = jest.fn();

/**
 * Mount the table with one filter-only, primary-filter field.
 */
function mountTable() {
	render(
		<ReportRecordsTable< Row >
			data={ rows }
			fields={ fields }
			getItemId={ item => item.id }
			initialView={ INITIAL_VIEW }
			onChangeView={ onChangeView }
		/>
	);
}

describe( 'ReportRecordsTable', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// An ordinary filter stays off the toolbar until the user adds it, so the
	// table opens unfiltered and the control does not compete with the search.
	it( 'does not show an unset filter until it is added', () => {
		mountTable();

		expect( screen.queryByRole( 'button', { name: /^Country/ } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps a filter-only field out of the columns', () => {
		mountTable();

		expect( screen.queryByRole( 'columnheader', { name: /Country/ } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'columnheader', { name: /Location/ } ) ).toBeInTheDocument();
	} );

	// The page needs the chosen value to reach its data request, because the
	// API applies this kind of filter server-side.
	it( 'reports the chosen filter value outwards', async () => {
		mountTable();

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /filter/i } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( await screen.findByRole( 'menuitem', { name: 'Country' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( await screen.findByRole( 'option', { name: 'India' } ) );

		const lastView = onChangeView.mock.calls.at( -1 )?.[ 0 ] as View;
		expect( lastView.filters ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { field: 'country', operator: 'is', value: 'IN' } ),
			] )
		);
	} );
} );

interface NumberedRow {
	id: string;
	label: string;
}

const NUMBERED_FIELDS: Field< NumberedRow >[] = [
	{ id: 'label', label: 'Label', getValue: ( { item } ) => item.label },
];

/**
 * Rows labelled `Row 1`…`Row n`.
 *
 * @param count - How many to build.
 * @return The rows.
 */
function numberedRows( count: number ): NumberedRow[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
	} ) );
}

/**
 * Render the table over `count` rows, ten to a page.
 *
 * @param count - How many rows to render.
 * @return The testing-library render result.
 */
function renderNumbered( count: number ) {
	return render(
		<ReportRecordsTable< NumberedRow >
			data={ numberedRows( count ) }
			fields={ NUMBERED_FIELDS }
			getItemId={ item => item.id }
			perPageSizes={ [ 10 ] }
		/>
	);
}

/**
 * Re-render the table over a different number of rows, as a refetch would.
 *
 * @param rerender - The render result's `rerender`.
 * @param count    - How many rows the new result has.
 */
function rerenderNumbered( rerender: ( ui: React.ReactElement ) => void, count: number ) {
	rerender(
		<ReportRecordsTable< NumberedRow >
			data={ numberedRows( count ) }
			fields={ NUMBERED_FIELDS }
			getItemId={ item => item.id }
			perPageSizes={ [ 10 ] }
		/>
	);
}

describe( 'ReportRecordsTable pagination', () => {
	it( 'falls back to the last page when a refetch leaves the current one out of range', () => {
		// The report page keys this table by tab, not by date range, so the
		// reader's page survives a range change. A smaller result would otherwise
		// slice to nothing and DataViews would render its "no results" state over
		// rows that exist, with the pagination hidden so there is no way back.
		const { rerender } = renderNumbered( 25 );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /next page/i } ) );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerenderNumbered( rerender, 8 );

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 8' ) ).toBeInTheDocument();
	} );

	it( 'keeps the pagination controls agreeing with the rows it fell back to', () => {
		const { rerender } = renderNumbered( 25 );

		const next = screen.getByRole( 'button', { name: /next page/i } );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( next );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( next );
		expect( screen.getByText( 'Row 21' ) ).toBeInTheDocument();

		rerenderNumbered( rerender, 12 );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveValue( '2' );
	} );

	it( 'leaves a page that is still in range alone', () => {
		const { rerender } = renderNumbered( 25 );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( screen.getByRole( 'button', { name: /next page/i } ) );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerenderNumbered( rerender, 22 );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 1' ) ).not.toBeInTheDocument();
	} );
} );
