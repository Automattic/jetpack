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

	describe( 'the GEO infotip', () => {
		// Queried by role and name throughout: a `Tooltip` would satisfy neither half of
		// that, since its popup isn't exposed to assistive technologies and it's disabled
		// on touch devices. The affordance being a real button in the accessibility tree
		// is the whole reason for using `Popover`, so every test below leans on it.
		it( 'reveals the definition of the acronym on click', () => {
			render( <DashboardNav active="overview">content</DashboardNav> );

			// Asserting it is absent first is what makes the assertion below meaningful:
			// a popover that rendered its content eagerly would pass either way.
			expect( screen.queryByText( /generative engine optimization/ ) ).not.toBeInTheDocument();

			// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn), matching the sibling tests.
			fireEvent.click( screen.getByRole( 'button', { name: 'What is GEO?' } ) );

			expect( screen.getByText( /generative engine optimization/ ) ).toBeInTheDocument();
		} );

		it( 'stays out of the tablist, so it cannot disturb tab navigation', () => {
			render( <DashboardNav active="overview">content</DashboardNav> );

			const trigger = screen.getByRole( 'button', { name: 'What is GEO?' } );

			// `Tabs.Tab` renders a `<button>`, so nesting the trigger inside the GEO tab
			// would be a button within a button; a non-tab child of the `tablist` would
			// break its arrow-key navigation. Both are ruled out by construction here.
			expect( screen.getByRole( 'tablist' ) ).not.toContainElement( trigger );
			expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).not.toContainElement( trigger );
		} );

		// The trigger sits after `Tabs.List`, which only reads as belonging to GEO while
		// GEO is the last tab. If one is ever appended after it, this fails and points at
		// the docblock in `dashboard-nav.tsx` that says the infotip needs moving.
		it( 'keeps GEO last, which is what makes the placement read correctly', () => {
			render( <DashboardNav active="overview">content</DashboardNav> );

			const labels = screen.getAllByRole( 'tab' ).map( tab => tab.textContent );
			expect( labels[ labels.length - 1 ] ).toBe( 'GEO' );
		} );

		it( 'is hidden along with the tab it explains on gated sites', () => {
			isGated.mockReturnValue( true );

			render( <DashboardNav active="overview">content</DashboardNav> );

			expect( screen.queryByRole( 'button', { name: 'What is GEO?' } ) ).not.toBeInTheDocument();
		} );
	} );
} );
