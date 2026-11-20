/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { ReportDrilldownTable } from '../report-drilldown-table';
import { ReportRecordsTable } from '../report-records-table';
import type { Field, View } from '@jetpack-premium-analytics/externals';
import type { ReactElement } from 'react';

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
const onChangePageItems = jest.fn();

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
			onChangePageItems={ onChangePageItems }
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

	it( 'draws the title field once, as the primary column', () => {
		render(
			<ReportRecordsTable< Row >
				data={ rows }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ { titleField: 'label' } }
			/>
		);

		expect( screen.getAllByText( 'Maharashtra' ) ).toHaveLength( 1 );
		// eslint-disable-next-line testing-library/no-node-access -- The class is DataViews' only mark of the primary column.
		expect( screen.getByText( 'Maharashtra' ).closest( '.dataviews-title-field' ) ).not.toBeNull();
		expect( screen.getByRole( 'columnheader', { name: /Views/ } ) ).toBeInTheDocument();
	} );

	it( 'reports the initial visible page outwards', async () => {
		mountTable();

		await waitFor( () => expect( onChangePageItems ).toHaveBeenLastCalledWith( rows ) );
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
		await waitFor( () => expect( onChangePageItems ).toHaveBeenLastCalledWith( [ rows[ 0 ] ] ) );
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

describe( 'ReportRecordsTable paging', () => {
	it( 'lists every row on one page with no page size menu', async () => {
		render(
			<ReportRecordsTable< NumberedRow >
				data={ numberedRows( 25 ) }
				fields={ NUMBERED_FIELDS }
				getItemId={ item => item.id }
			/>
		);

		expect( screen.getByText( 'Row 25' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /next page/i } ) ).not.toBeInTheDocument();

		await userEvent.setup().click( screen.getByRole( 'button', { name: 'View options' } ) );
		await expect( screen.findByText( 'Sort by' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Items per page' ) ).not.toBeInTheDocument();
	} );
} );

type TableProps = { isLoading?: boolean; isFetching?: boolean };

// Each table wires its own empty-state and revalidation guards, so both run the same cases.
const TABLES: [ string, ( data: Row[], props?: TableProps ) => ReactElement ][] = [
	[
		'ReportRecordsTable',
		( data, props ) => (
			<ReportRecordsTable< Row >
				data={ data }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ INITIAL_VIEW }
				{ ...props }
			/>
		),
	],
	[
		'ReportDrilldownTable',
		( data, props ) => (
			<ReportDrilldownTable< Row >
				data={ data }
				fields={ fields }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
				initialView={ INITIAL_VIEW }
				{ ...props }
			/>
		),
	],
];

describe.each( TABLES )( '%s with no rows', ( _name, table ) => {
	it( 'replaces the table with the empty state when the report has no rows', () => {
		render( table( [] ) );

		expect( screen.getByRole( 'heading', { name: 'No data found' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'We couldn’t find any results.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'searchbox' ) ).not.toBeInTheDocument();
	} );

	it( 'shows no search box or empty state while the first rows load', () => {
		render( table( [], { isLoading: true } ) );

		expect( screen.queryByRole( 'searchbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'No data found' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the empty state while the same period revalidates', () => {
		render( table( [], { isFetching: true } ) );

		expect( screen.getByRole( 'heading', { name: 'No data found' } ) ).toBeInTheDocument();
	} );

	it( 'shows cached rows that mount already revalidating', () => {
		render( table( rows, { isFetching: true } ) );

		expect( screen.getByText( 'Maharashtra' ) ).toBeInTheDocument();
	} );

	it( 'keeps the rows on screen and marks the table busy while they revalidate', () => {
		const { rerender } = render( table( rows ) );

		rerender( table( rows, { isFetching: true } ) );

		expect( screen.getByText( 'Maharashtra' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'table' ) ).toHaveAttribute( 'aria-busy', 'true' );
	} );
} );

describe( 'ReportRecordsTable with no rows', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'keeps the table while a filter has scoped the rows to none', () => {
		render(
			<ReportRecordsTable< Row >
				data={ [] }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ {
					...INITIAL_VIEW,
					filters: [ { field: 'country', operator: 'is', value: 'US' } ],
				} }
			/>
		);

		expect( screen.getByRole( 'searchbox' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'No data found' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the table and its "No results" when a search matches no rows', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<ReportRecordsTable< Row >
				data={ rows }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ INITIAL_VIEW }
			/>
		);

		await user.type( screen.getByRole( 'searchbox' ), 'no such place' );

		await expect( screen.findByText( 'No results' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'No data found' } ) ).not.toBeInTheDocument();
	} );
} );
