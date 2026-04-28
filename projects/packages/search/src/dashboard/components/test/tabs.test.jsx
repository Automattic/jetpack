import { render, screen } from '@testing-library/react';
import * as React from 'react';
import DashboardTabs from '../tabs';

describe( 'DashboardTabs', () => {
	it( 'renders Plan & Usage tab', () => {
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ jest.fn() } /> );
		expect( screen.getByText( 'Plan & Usage' ) ).toBeInTheDocument();
	} );

	it( 'renders AI Answers tab with Preview label', () => {
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ jest.fn() } /> );
		expect( screen.getByText( 'AI Answers' ) ).toBeInTheDocument();
		expect( screen.getByText( '(Preview)' ) ).toBeInTheDocument();
	} );

	it( 'does not render Topics tab', () => {
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ jest.fn() } /> );
		expect( screen.queryByText( 'Topics' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render Overview tab', () => {
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ jest.fn() } /> );
		expect( screen.queryByText( 'Overview' ) ).not.toBeInTheDocument();
	} );
} );
