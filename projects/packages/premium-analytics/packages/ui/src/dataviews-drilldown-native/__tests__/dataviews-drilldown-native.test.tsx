import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataViewsDrilldownNative } from '../dataviews-drilldown-native';
import type { DataViewsDrilldownNativeProps } from '../dataviews-drilldown-native';
import type { Field } from '@jetpack-premium-analytics/externals';

type Row = {
	id: string;
	parentId?: string;
	referrer: string;
	views: number;
};

const rows: Row[] = [
	{ id: 'search', referrer: 'Search Engines', views: 625 },
	{ id: 'google', parentId: 'search', referrer: 'Google', views: 485 },
	{ id: 'google-search', parentId: 'google', referrer: 'Google Search', views: 420 },
	{ id: 'bing', parentId: 'search', referrer: 'Bing', views: 86 },
	{ id: 'social', referrer: 'Social', views: 345 },
	{ id: 'facebook', parentId: 'social', referrer: 'Facebook', views: 210 },
];

const fields: Field< Row >[] = [
	{
		id: 'referrer',
		label: 'Referrer',
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.referrer,
	},
	{
		id: 'views',
		label: 'Views',
		getValue: ( { item } ) => item.views,
	},
];

function renderTable( props: Partial< DataViewsDrilldownNativeProps< Row > > = {} ) {
	return render(
		<DataViewsDrilldownNative< Row >
			data={ rows }
			fields={ fields }
			getItemId={ item => item.id }
			getItemParentId={ item => item.parentId }
			initialView={ { fields: [ 'referrer', 'views' ], perPage: 25 } }
			searchLabel="Search referrers"
			{ ...props }
		/>
	);
}

const inlineFieldsTable = () => (
	<DataViewsDrilldownNative< Row >
		data={ rows }
		fields={ fields.map( field => ( { ...field } ) ) }
		getItemId={ item => item.id }
		getItemParentId={ item => item.parentId }
		initialView={ { fields: [ 'referrer', 'views' ], perPage: 25 } }
		searchLabel="Search referrers"
		collapsible
	/>
);

const renderedRows = () =>
	screen
		.getAllByRole( 'row' )
		.slice( 1 )
		.map( row => row.textContent?.replace( /—/g, '' ).trim() );

describe( 'DataViewsDrilldownNative collapse', () => {
	it( 'renders no toggles at all unless collapsing is asked for', () => {
		renderTable();

		expect( screen.queryByRole( 'button', { expanded: true } ) ).not.toBeInTheDocument();
		expect( renderedRows() ).toHaveLength( rows.length );
	} );

	it( 'offers a toggle on rows with children only', () => {
		renderTable( { collapsible: true } );

		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Google' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Bing' } ) ).not.toBeInTheDocument();
	} );

	it( 'names the toggle from the row value when the field has no getValue', () => {
		// DataViews' own default: a field without `getValue` reads `item[field.id]`.
		const bare: Field< Row >[] = [
			{ id: 'referrer', label: 'Referrer', render: ( { item } ) => <span>{ item.referrer }</span> },
			{ id: 'views', label: 'Views' },
		];
		renderTable( { collapsible: true, fields: bare } );

		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toBeInTheDocument();
	} );

	it( 'folds a row’s whole subtree away when collapsed, and back on expand', async () => {
		const user = userEvent.setup();
		renderTable( { collapsible: true } );

		await user.click( screen.getByRole( 'button', { name: 'Search Engines' } ) );

		expect( screen.queryByText( 'Google' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Google Search' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Search Engines' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Facebook' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);

		await user.click( screen.getByRole( 'button', { name: 'Search Engines' } ) );

		expect( screen.getByText( 'Google Search' ) ).toBeInTheDocument();
	} );

	it( 'keeps focus on a toggle after it changes the fold state', async () => {
		const user = userEvent.setup();
		renderTable( { collapsible: true } );
		const toggle = screen.getByRole( 'button', { name: 'Search Engines' } );

		toggle.focus();
		await user.keyboard( '{Enter}' );

		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toBe( toggle );
		expect( toggle ).toHaveFocus();
	} );

	it( 'keeps the toggle mounted when the consumer rebuilds its fields array', () => {
		const { rerender } = render( inlineFieldsTable() );
		const toggle = screen.getByRole( 'button', { name: 'Search Engines' } );

		toggle.focus();
		rerender( inlineFieldsTable() );

		// A per-render `render` component would remount the cell here, taking
		// the focused toggle with it.
		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toBe( toggle );
		expect( toggle ).toHaveFocus();
	} );

	it( 'does not force branches open for a filter that narrows nothing', () => {
		renderTable( {
			collapsible: true,
			defaultExpanded: 'none',
			initialView: {
				fields: [ 'referrer', 'views' ],
				perPage: 25,
				filters: [ { field: 'referrer', operator: 'isAny', value: [] } ],
			},
		} );

		expect( renderedRows() ).toEqual( [
			expect.stringContaining( 'Search Engines' ),
			expect.stringContaining( 'Social' ),
		] );
		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toBeInTheDocument();
	} );

	it( 'starts folded when asked, and still expands on demand', async () => {
		const user = userEvent.setup();
		renderTable( { collapsible: true, defaultExpanded: 'none' } );

		expect( renderedRows() ).toEqual( [
			expect.stringContaining( 'Search Engines' ),
			expect.stringContaining( 'Social' ),
		] );

		await user.click( screen.getByRole( 'button', { name: 'Search Engines' } ) );

		expect( screen.getByText( 'Google' ) ).toBeInTheDocument();
		// Only one level opens: the child keeps its own folded state.
		expect( screen.queryByText( 'Google Search' ) ).not.toBeInTheDocument();
	} );

	it( 'reveals a match that sits under a folded parent when searching', async () => {
		const user = userEvent.setup();
		renderTable( { collapsible: true, defaultExpanded: 'none' } );

		await user.type( screen.getByRole( 'searchbox' ), 'Google Search' );

		await expect( screen.findByText( 'Google Search' ) ).resolves.toBeInTheDocument();
		// The ancestors come back as context, not as a flat result list.
		expect( screen.getByText( 'Search Engines' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Google' ) ).toBeInTheDocument();
		// A branch the search never touched stays folded.
		expect( screen.queryByText( 'Facebook' ) ).not.toBeInTheDocument();
		// A forced-open ancestor is still a group, so it keeps its control and
		// its state — it just cannot be used to write a fold yet.
		const forced = screen.getByRole( 'button', { name: 'Search Engines' } );
		expect( forced ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( forced ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'button', { name: 'Google' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		// Clicking it writes nothing, so clearing the search folds everything
		// back instead of surfacing a fold the reader never saw take effect.
		await user.click( forced );
		await user.clear( screen.getByRole( 'searchbox' ) );

		await waitFor( () => expect( screen.queryByText( 'Google' ) ).not.toBeInTheDocument() );
		expect( screen.getByRole( 'button', { name: 'Search Engines' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	} );

	it( 'counts only the visible rows when paginating', async () => {
		const user = userEvent.setup();
		renderTable( {
			collapsible: true,
			initialView: { fields: [ 'referrer', 'views' ], perPage: 2 },
		} );

		expect( screen.getByText( 'of 3' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Search Engines' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Social' } ) );

		// The folded children stop consuming pages, rather than paginating rows
		// nobody can see.
		expect( screen.queryByRole( 'button', { name: 'Next page' } ) ).not.toBeInTheDocument();
		expect( renderedRows() ).toHaveLength( 2 );
	} );
} );
