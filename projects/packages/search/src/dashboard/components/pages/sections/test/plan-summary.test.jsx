import { render, screen } from '@testing-library/react';
import PlanSummary from '../plan-summary';

describe( 'PlanSummary', () => {
	const basePlanInfo = {
		latestMonthRequests: {
			start_date: '2026-02-01T00:00:00',
			end_date: '2026-02-28T00:00:00',
		},
	};

	it( 'renders the usage heading', () => {
		render( <PlanSummary isFreePlan={ false } planInfo={ basePlanInfo } /> );
		expect( screen.getByRole( 'heading' ) ).toBeInTheDocument();
		expect( screen.getByText( /your usage/i ) ).toBeInTheDocument();
	} );

	it( 'shows "Free plan" label for free plan users', () => {
		render( <PlanSummary isFreePlan={ true } planInfo={ basePlanInfo } /> );
		expect( screen.getByText( /Free plan/i ) ).toBeInTheDocument();
	} );

	it( 'shows "Upgraded" label for paid plan users', () => {
		render( <PlanSummary isFreePlan={ false } planInfo={ basePlanInfo } /> );
		expect( screen.getByText( /Upgraded/i ) ).toBeInTheDocument();
	} );

	it( 'shows empty date range when latestMonthRequests is absent', () => {
		render( <PlanSummary isFreePlan={ false } planInfo={ {} } /> );
		// Heading and plan label should still render, just no date range text
		expect( screen.getByText( /your usage/i ) ).toBeInTheDocument();
		const span = screen.getByText( /Upgraded/i );
		// The parent span should start with "(" — no dates means empty string before the bracket
		expect( span ).toHaveTextContent( /^\s*\(Upgraded\)/ );
	} );

	it( 'renders a date range from latestMonthRequests', () => {
		render( <PlanSummary isFreePlan={ false } planInfo={ basePlanInfo } /> );
		// The heading should contain at least one digit from the formatted date range.
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( /\d/ );
	} );
} );
