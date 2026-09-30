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

	it( 'shows the table loading state while rows on screen revalidate', () => {
		render(
			<ReportDrilldownTable< { id: string; label: string } >
				data={ [ { id: 'google', label: 'Google Search' } ] }
				fields={ [ { id: 'label', label: 'Referrer', getValue: ( { item } ) => item.label } ] }
				getItemId={ item => item.id }
				getItemParentId={ () => null }
				isFetching
			/>
		);

		expect( screen.getByRole( 'searchbox' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Google Search' ) ).not.toBeInTheDocument();
	} );
} );
