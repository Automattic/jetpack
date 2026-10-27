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

	it( 'labels the /geo tab "GEO" (not "AI")', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getByRole( 'tab', { name: 'GEO' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: 'AI' } ) ).not.toBeInTheDocument();
	} );

	it( 'navigates to /geo when the GEO tab is selected', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep (avoids lockfile churn), matching the sibling enable-seo-card test.
		fireEvent.click( screen.getByRole( 'tab', { name: 'GEO' } ) );

		expect( navigate ).toHaveBeenCalledWith( { href: '/geo' } );
	} );

	it( 'shows all four tabs, Settings last, when the dashboard is not gated', () => {
		render( <DashboardNav active="overview">content</DashboardNav> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Content',
			'GEO',
			'Settings',
		] );
	} );

	it( 'hides the Content and GEO tabs when the dashboard is gated', () => {
		isGated.mockReturnValue( true );

		render( <DashboardNav active="overview">content</DashboardNav> );

		// The two free tabs remain; the paid Content and GEO tabs are gone.
		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Settings',
		] );
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

		// The trigger sits after `Tabs.List`, but Settings follows GEO, so it is moved to
		// the GEO tab's end. jsdom has no layout, so the two boxes are stubbed.
		it( 'is placed at the end of the GEO tab, not after the last tab', () => {
			const rect = ( left: number, right: number ) =>
				( { left, right, top: 0, bottom: 40, width: right - left, height: 40 } ) as DOMRect;
			const spy = jest
				.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
				.mockImplementation( function ( this: HTMLElement ) {
					if ( this.classList.contains( 'jetpack-seo-tabs-strip' ) ) {
						return rect( 100, 900 );
					}
					if ( this.classList.contains( 'jetpack-seo-tabs-strip__geo-tab' ) ) {
						return rect( 300, 340 );
					}
					return rect( 0, 0 );
				} );

			render( <DashboardNav active="overview">content</DashboardNav> );

			// 340 (GEO tab's end) - 100 (strip's start).
			expect( screen.getByRole( 'button', { name: 'What is GEO?' } ) ).toHaveStyle( {
				insetInlineStart: '240px',
			} );
			spy.mockRestore();
		} );

		it( 'is hidden along with the tab it explains on gated sites', () => {
			isGated.mockReturnValue( true );

			render( <DashboardNav active="overview">content</DashboardNav> );

			expect( screen.queryByRole( 'button', { name: 'What is GEO?' } ) ).not.toBeInTheDocument();
		} );
	} );
} );
