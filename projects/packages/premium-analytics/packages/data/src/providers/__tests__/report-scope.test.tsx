/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportScopeProvider, useReportScope } from '../report-scope';

function ScopeProbe() {
	const { offersComparison } = useReportScope();

	return <span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>;
}

describe( 'useReportScope', () => {
	it( 'offers comparison when no provider wraps the tree', () => {
		render( <ScopeProbe /> );

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );

	it( 'takes the value from the nearest provider', () => {
		render(
			<ReportScopeProvider offersComparison={ false }>
				<ReportScopeProvider offersComparison>
					<ScopeProbe />
				</ReportScopeProvider>
			</ReportScopeProvider>
		);

		expect( screen.getByText( 'offers comparison' ) ).toBeInTheDocument();
	} );
} );
