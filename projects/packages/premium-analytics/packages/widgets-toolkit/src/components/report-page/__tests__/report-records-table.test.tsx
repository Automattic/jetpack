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
