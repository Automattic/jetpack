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
} );
