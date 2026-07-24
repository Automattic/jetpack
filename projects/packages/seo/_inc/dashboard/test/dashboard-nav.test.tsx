import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const navigate = jest.fn();
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

jest.unstable_mockModule( '../../data/is-gated', () => ( {
	isGated,
} ) );

const { default: DashboardNav } = await import( '../dashboard-nav' );

describe( 'DashboardNav', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		isGated.mockReturnValue( false );
	} );

	it( 'labels the AI-route tab "GEO" (not "AI")', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'AI' } ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to /ai when the GEO tab is selected', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn), matching the sibling enable-seo-card test.
		fireEvent.click( screen.getByRole( 'tab', { name: 'GEO' } ) );

		expect( navigate ).toHaveBeenCalledWith( { href: '/ai' } );
	} );

	it( 'shows all four tabs when the dashboard is not gated', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Content' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).toBeInTheDocument();
	} );

	it( 'hides the Content and GEO tabs when the dashboard is gated', () => {
		isGated.mockReturnValue( true );

		render( <DashboardNav active="overview">content</DashboardNav> );

		// The two free tabs remain; the paid Content and GEO tabs are gone.
		expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'Content' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'GEO' } ) ).not.toBeInTheDocument();
	} );
} );
