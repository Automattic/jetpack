/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

		// eslint-disable-next-line testing-library/prefer-user-event -- the filter menu's composite warns under a real focus sequence.
		fireEvent.click( screen.getByRole( 'button', { name: /filter/i } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- as above.
		fireEvent.click( await screen.findByRole( 'menuitem', { name: 'Country' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- as above.
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

/** Rows labelled `Row 1`…`Row n`. */
function numberedRows( count: number ): NumberedRow[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: String( index + 1 ),
		label: `Row ${ index + 1 }`,
	} ) );
}

const numberedTable = ( count: number ) => (
	<ReportRecordsTable< NumberedRow >
		data={ numberedRows( count ) }
		fields={ NUMBERED_FIELDS }
		getItemId={ item => item.id }
		perPageSizes={ [ 10 ] }
	/>
);

const goToPage = async ( user: ReturnType< typeof userEvent.setup >, page: number ) => {
	for ( let step = 1; step < page; step++ ) {
		await user.click( screen.getByRole( 'button', { name: /next page/i } ) );
	}
};

describe( 'ReportRecordsTable pagination', () => {
	it( 'falls back to the last page when a refetch leaves the current one out of range', async () => {
		// The report page keys this table by tab, not by date range, so the
		// reader's page survives a range change. A smaller result would otherwise
		// slice to nothing and DataViews would render its "no results" state over
		// rows that exist, with the pagination hidden so there is no way back.
		const user = userEvent.setup();
		const { rerender } = render( numberedTable( 25 ) );

		await goToPage( user, 2 );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender( numberedTable( 8 ) );

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 8' ) ).toBeInTheDocument();
	} );

	it( 'keeps the pagination controls agreeing with the rows it fell back to', async () => {
		const user = userEvent.setup();
		const { rerender } = render( numberedTable( 25 ) );

		await goToPage( user, 3 );
		expect( screen.getByText( 'Row 21' ) ).toBeInTheDocument();

		rerender( numberedTable( 12 ) );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'combobox', { name: /page/i } ) ).toHaveValue( '2' );
	} );

	it( 'reports the page it fell back to outwards', async () => {
		// The page mirrors this view into its data request, so a clamp it never
		// hears about would leave it requesting a page that is not on screen.
		const user = userEvent.setup();
		const reportedViews = jest.fn();
		const withSpy = ( count: number ) => (
			<ReportRecordsTable< NumberedRow >
				data={ numberedRows( count ) }
				fields={ NUMBERED_FIELDS }
				getItemId={ item => item.id }
				perPageSizes={ [ 10 ] }
				onChangeView={ reportedViews }
			/>
		);
		const { rerender } = render( withSpy( 25 ) );

		await goToPage( user, 3 );
		rerender( withSpy( 12 ) );

		expect( reportedViews.mock.calls.at( -1 )?.[ 0 ] ).toMatchObject( { page: 2 } );
	} );

	it( 'stays where it fell back to when a later result grows again', async () => {
		const user = userEvent.setup();
		const { rerender } = render( numberedTable( 25 ) );

		await goToPage( user, 3 );
		rerender( numberedTable( 8 ) );
		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();

		rerender( numberedTable( 25 ) );

		expect( screen.getByText( 'Row 1' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 21' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves a page that is still in range alone', async () => {
		const user = userEvent.setup();
		const { rerender } = render( numberedTable( 25 ) );

		await goToPage( user, 2 );
		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();

		rerender( numberedTable( 22 ) );

		expect( screen.getByText( 'Row 11' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Row 1' ) ).not.toBeInTheDocument();
	} );
} );
