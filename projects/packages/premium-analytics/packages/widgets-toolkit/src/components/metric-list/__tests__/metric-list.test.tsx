/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricList, type MetricListItem } from '../metric-list';

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 24;

/** Stub list, header and row heights because jsdom does not perform layout. */
function mockLayout( rootHeight: number ) {
	jest.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockImplementation( function (
		this: HTMLElement
	) {
		let height = rootHeight;
		if ( this.tagName === 'LI' ) {
			height = ROW_HEIGHT;
		} else if ( this.dataset.testid === 'metric-list-header' ) {
			height = HEADER_HEIGHT;
		}
		return { width: 400, height } as DOMRect;
	} );
}

function buildItems( count: number ): MetricListItem[] {
	return Array.from( { length: count }, ( _, index ) => ( {
		id: index,
		label: `Email ${ index }`,
		value: `${ index }%`,
	} ) );
}

describe( 'MetricList', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'renders each row as a label and a value', () => {
		render( <MetricList items={ buildItems( 2 ) } /> );

		expect( screen.getByText( 'Email 0' ) ).toBeInTheDocument();
		expect( screen.getByText( '1%' ) ).toBeInTheDocument();
	} );

	it( 'keeps a row action in the label cell, beside the label', () => {
		render(
			<MetricList
				items={ [ { id: 1, label: 'Email', value: '5%', action: <a href="/view">View</a> } ] }
			/>
		);

		const row = within( screen.getByRole( 'listitem' ) );
		expect( row.getByRole( 'link', { name: 'View' } ) ).toBeInTheDocument();
		expect( row.getByText( 'Email' ) ).toBeInTheDocument();
		expect( row.getByText( '5%' ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state when there are no rows', () => {
		render( <MetricList items={ [] } emptyStateText="Nothing yet." /> );

		expect( screen.getByText( 'Nothing yet.' ) ).toBeInTheDocument();
	} );

	it( 'hides the rows that do not fit the available height', () => {
		// Room for three whole rows and part of a fourth.
		mockLayout( ROW_HEIGHT * 3 + 20 );

		render( <MetricList items={ buildItems( 6 ) } /> );

		expect( screen.getByText( 'Email 2' ) ).toBeVisible();
		expect( screen.queryByText( 'Email 3' ) ).not.toBeVisible();
		// `hidden` is what takes the dropped rows out of the accessibility tree
		// and the focus order; a display class alone would leave them both.
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
	} );

	it( 'fits rows in the height left under the header', () => {
		// Five rows fit the whole list, but only four fit under the header.
		mockLayout( ROW_HEIGHT * 5 );

		render(
			<MetricList items={ buildItems( 6 ) } columns={ { label: 'Emails', values: [ 'Opens' ] } } />
		);

		expect( screen.getByText( 'Opens' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );

	it( 'keeps every row when fitting is off', () => {
		mockLayout( ROW_HEIGHT );

		render( <MetricList items={ buildItems( 4 ) } fitRows={ false } /> );

		expect( screen.getByText( 'Email 3' ) ).toBeVisible();
	} );

	it( 'keeps the first row even when nothing fits', () => {
		mockLayout( 4 );

		render( <MetricList items={ buildItems( 3 ) } /> );

		expect( screen.getByText( 'Email 0' ) ).toBeVisible();
		expect( screen.queryByText( 'Email 1' ) ).not.toBeVisible();
	} );
} );
