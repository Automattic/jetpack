/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportDrilldownTable } from '../report-drilldown-table';

describe( 'ReportDrilldownTable', () => {
	it( 'replaces the table with the empty state when the report has no rows', () => {
		render(
			<ReportDrilldownTable< { id: string } >
				data={ [] }
				fields={ [] }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
			/>
		);

		expect( screen.getByRole( 'heading', { name: 'No data found' } ) ).toBeInTheDocument();
	} );

	it( 'shows no search box or empty state while the rows load', () => {
		render(
			<ReportDrilldownTable< { id: string } >
				data={ [] }
				fields={ [] }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
				isLoading
			/>
		);

		expect( screen.queryByRole( 'searchbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'No data found' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the empty state while the same period revalidates', () => {
		render(
			<ReportDrilldownTable< { id: string } >
				data={ [] }
				fields={ [] }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
				isFetching
			/>
		);

		expect( screen.getByRole( 'heading', { name: 'No data found' } ) ).toBeInTheDocument();
	} );

	/**
	 * Render the table over one referrer row.
	 *
	 * @param isFetching - Whether the row on screen is revalidating.
	 * @return The table element.
	 */
	function referrerTable( isFetching = false ) {
		return (
			<ReportDrilldownTable< { id: string; label: string } >
				data={ [ { id: 'google', label: 'Google Search' } ] }
				fields={ [ { id: 'label', label: 'Referrer', getValue: ( { item } ) => item.label } ] }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
				isFetching={ isFetching }
			/>
		);
	}

	it( 'shows cached rows that mount already revalidating', () => {
		render( referrerTable( true ) );

		expect( screen.getByText( 'Google Search' ) ).toBeInTheDocument();
	} );

	it( 'keeps the rows on screen and marks the table busy while they revalidate', () => {
		const { rerender } = render( referrerTable() );

		rerender( referrerTable( true ) );

		expect( screen.getByText( 'Google Search' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'table' ) ).toHaveAttribute( 'aria-busy', 'true' );
	} );
} );
