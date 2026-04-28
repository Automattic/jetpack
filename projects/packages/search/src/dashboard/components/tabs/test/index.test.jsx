import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardTabs from 'components/tabs';

describe( 'DashboardTabs', () => {
	it( 'renders two tabs', () => {
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ jest.fn() } /> );
		expect( screen.getByText( 'Plan & Usage' ) ).toBeInTheDocument();
		expect( screen.getByText( 'AI Answers' ) ).toBeInTheDocument();
		expect( screen.getByText( '(Preview)' ) ).toBeInTheDocument();
	} );

	it( 'marks the active tab with aria-selected', () => {
		render( <DashboardTabs activeTab="ai-answers" onTabChange={ jest.fn() } /> );
		const activeTab = screen.getByRole( 'tab', { name: /AI Answers/ } );
		expect( activeTab ).toHaveAttribute( 'aria-selected', 'true' );
		expect( activeTab ).toHaveClass( 'jp-search-dashboard-tabs__tab--active' );
		const inactiveTab = screen.getByRole( 'tab', { name: 'Plan & Usage' } );
		expect( inactiveTab ).toHaveAttribute( 'aria-selected', 'false' );
	} );

	it( 'calls onTabChange when a tab is clicked', async () => {
		const onChange = jest.fn();
		render( <DashboardTabs activeTab="plan-usage" onTabChange={ onChange } /> );
		await userEvent.click( screen.getByRole( 'tab', { name: /AI Answers/ } ) );
		expect( onChange ).toHaveBeenCalledWith( 'ai-answers' );
	} );
} );
