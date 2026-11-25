import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const navigate = jest.fn();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

const { default: DashboardNav } = await import( '../dashboard-nav' );

describe( 'DashboardNav', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'labels the /geo tab "GEO" (not "AI")', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'AI' } ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to /geo when the GEO tab is selected', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn).
		fireEvent.click( screen.getByRole( 'tab', { name: 'GEO' } ) );

		expect( navigate ).toHaveBeenCalledWith( { href: '/geo' } );
	} );

	it( 'can hide the tabs and keep the content', () => {
		render(
			<DashboardNav active="settings" showTabs={ false }>
				content
			</DashboardNav>
		);

		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'content' ) ).toBeInTheDocument();
	} );

	it( 'shows all four tabs with Settings last', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Content',
			'GEO',
			'Settings',
		] );
	} );
} );
