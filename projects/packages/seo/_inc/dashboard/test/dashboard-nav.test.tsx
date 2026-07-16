import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mock is registered.
const navigate = jest.fn();

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => navigate,
} ) );

const { default: DashboardNav } = await import( '../dashboard-nav' );

describe( 'DashboardNav', () => {
	beforeEach( () => {
		jest.clearAllMocks();
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
} );
