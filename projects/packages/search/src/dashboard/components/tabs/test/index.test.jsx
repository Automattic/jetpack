import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardTabs from 'components/tabs';

describe( 'DashboardTabs', () => {
	it( 'renders three tabs', () => {
		render( <DashboardTabs activeTab="overview" onTabChange={ jest.fn() } /> );
		expect( screen.getByText( 'Overview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Behavior' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Topics' ) ).toBeInTheDocument();
	} );

	it( 'marks the active tab with aria-selected', () => {
		render( <DashboardTabs activeTab="behavior" onTabChange={ jest.fn() } /> );
		const activeTab = screen.getByRole( 'tab', { name: 'Behavior' } );
		expect( activeTab ).toHaveAttribute( 'aria-selected', 'true' );
		expect( activeTab ).toHaveClass( 'jp-search-dashboard-tabs__tab--active' );
		const inactiveTab = screen.getByRole( 'tab', { name: 'Overview' } );
		expect( inactiveTab ).toHaveAttribute( 'aria-selected', 'false' );
	} );

	it( 'calls onTabChange when a tab is clicked', async () => {
		const onChange = jest.fn();
		render( <DashboardTabs activeTab="overview" onTabChange={ onChange } /> );
		await userEvent.click( screen.getByText( 'Topics' ) );
		expect( onChange ).toHaveBeenCalledWith( 'topics' );
	} );
} );
