/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportScopeProvider, useReportScope } from '../report-scope';

function ScopeProbe() {
	const { offersComparison, openPeriod } = useReportScope();

	return (
		<>
			<span>{ offersComparison ? 'offers comparison' : 'no comparison' }</span>
			<span>comparison: { String( offersComparison ) }</span>
			<span>{ openPeriod ? 'opens a period' : 'no period' }</span>
		</>
	);
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

	it( 'keeps what an outer provider declared when an inner one adds to it', () => {
		render(
			<ReportScopeProvider offersComparison={ false }>
				<ReportScopeProvider openPeriod={ jest.fn() }>
					<ScopeProbe />
				</ReportScopeProvider>
			</ReportScopeProvider>
		);

		expect( screen.getByText( 'comparison: false' ) ).toBeInTheDocument();
		expect( screen.getByText( 'opens a period' ) ).toBeInTheDocument();
	} );
} );
