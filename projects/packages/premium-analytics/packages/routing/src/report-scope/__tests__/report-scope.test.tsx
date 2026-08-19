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

	it( 'takes the value the nearest provider declares', () => {
		render(
			<ReportScopeProvider offersComparison={ false }>
				<ScopeProbe />
			</ReportScopeProvider>
		);

		expect( screen.getByText( 'no comparison' ) ).toBeInTheDocument();
	} );
} );
