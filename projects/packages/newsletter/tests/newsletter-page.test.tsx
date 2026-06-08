// The `newsletter-page.tsx` shell is the surface that two routed tabs share —
// the active-tab indicator slides between Subscribers and Settings because the
// `Tabs.Root` mounts once. Tab-view analytics are owned by the route stage
// (covered in `stage.test.tsx`), so this file's contracts are navigation-only:
//
// 1. flipping to a different tab routes the visitor via `useNavigate` with the
//    subscriber-detail params cleared.
// 2. clicking the already-active tab still navigates so the URL stays
//    canonical (`?tab=undefined` clears stale params).
// 3. when `subscriberManagementEnabled` is false the tab nav doesn't render
//    so Settings-only hosts never see a phantom Subscribers tab.

const mockNavigate = jest.fn();
const mockGetSiteData = jest.fn( () => ( {
	rest_root: 'https://example.com/wp-json/',
	rest_nonce: 'test-nonce',
	admin_url: 'https://example.com/wp-admin/',
} ) );
// Captures the props the shell passes to `AdminPage` so we can assert the
// REST root/nonce wiring that keeps the Settings tab off a relative root.
const mockAdminPageProps = jest.fn();
const mockGetNewsletterScriptData = jest.fn< unknown, [] >();
// `mockTabsOnValueChange` is the `onValueChange` callback captured by the
// `@wordpress/ui` mock below. Tests can call it directly to drive the
// component without going through the rendered tab buttons.
const mockTabsOnValueChange: { current: ( ( value: string | null ) => void ) | null } = {
	current: null,
};

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => mockGetSiteData(),
} ) );

// `AdminPage` owns the header (logo + title) and the `JetpackFooter`. The mock
// renders the header slots and a footer marker gated on `showFooter` so the
// footer-contract tests below can assert the `hideFooter` → `showFooter={false}`
// wiring without pulling in admin-ui internals.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: props => {
		mockAdminPageProps( props );
		const { children, actions, title, subTitle, showFooter } = props;
		return (
			<div data-testid="admin-page">
				<div data-testid="page-title">{ title }</div>
				<div data-testid="page-subtitle">{ subTitle }</div>
				<div data-testid="page-actions">{ actions }</div>
				{ children }
				{ showFooter && <div data-testid="jetpack-footer" /> }
			</div>
		);
	},
} ) );

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
} ) );

// Replace the @wordpress/ui Tabs primitive with a thin shim that just renders
// each Tab as a button calling `onValueChange`. The real component animates an
// indicator + manages focus, which we don't need to assert.
jest.mock( '@wordpress/ui', () => {
	// The factory can only reference variables prefixed with `mock`; reach back
	// into the captured callback so each render rewires `mockTabsOnValueChange`.
	const tabsRootContext = { onValueChange: () => {} };
	return {
		Tabs: {
			Root: ( { onValueChange, children } ) => {
				tabsRootContext.onValueChange = onValueChange;
				mockTabsOnValueChange.current = onValueChange;
				return <div data-testid="tabs-root">{ children }</div>;
			},
			List: ( { children } ) => <div role="tablist">{ children }</div>,
			Tab: ( { value, children } ) => (
				<button
					type="button"
					role="tab"
					data-tab-value={ value }
					// Test-only mock — the closure over `value` is intentional and
					// the re-bind-per-render cost is irrelevant in a jest render.
					// eslint-disable-next-line react/jsx-no-bind
					onClick={ () => tabsRootContext.onValueChange( value ) }
				>
					{ children }
				</button>
			),
			Panel: ( { value, children } ) => (
				<div data-testid={ `tabs-panel-${ value }` }>{ children }</div>
			),
		},
	};
} );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: () => mockGetNewsletterScriptData(),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import NewsletterPage from '../_inc/components/newsletter-page';

beforeEach( () => {
	mockNavigate.mockReset();
	mockGetSiteData.mockClear();
	mockAdminPageProps.mockClear();
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( { subscriberManagementEnabled: true } );
	mockTabsOnValueChange.current = null;
} );

describe( 'NewsletterPage tab navigation', () => {
	it( 'navigates to ?tab=settings and clears subscriber-detail params on switch', () => {
		render(
			<NewsletterPage activeTab="subscribers">
				<div>panel body</div>
			</NewsletterPage>
		);

		screen
			.getAllByRole( 'tab' )
			.find( tab => tab.getAttribute( 'data-tab-value' ) === 'settings' )
			?.click();

		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		const navArg = mockNavigate.mock.calls[ 0 ][ 0 ] as { search: Record< string, unknown > };
		expect( navArg.search.tab ).toBe( 'settings' );
		// subscriber-detail params (`subscriber`, `u`) must be cleared so the
		// inspector doesn't hitchhike across to Settings.
		expect( navArg.search.subscriber ).toBeUndefined();
		expect( navArg.search.u ).toBeUndefined();
	} );

	it( 'clears the ?tab= param when navigating back to Subscribers', () => {
		render(
			<NewsletterPage activeTab="settings">
				<div>panel body</div>
			</NewsletterPage>
		);

		screen
			.getAllByRole( 'tab' )
			.find( tab => tab.getAttribute( 'data-tab-value' ) === 'subscribers' )
			?.click();

		const navArg = mockNavigate.mock.calls[ 0 ][ 0 ] as { search: Record< string, unknown > };
		expect( navArg.search.tab ).toBeUndefined();
	} );

	it( 'still navigates when clicking the active tab so the URL stays canonical', () => {
		render(
			<NewsletterPage activeTab="subscribers">
				<div>panel body</div>
			</NewsletterPage>
		);

		screen
			.getAllByRole( 'tab' )
			.find( tab => tab.getAttribute( 'data-tab-value' ) === 'subscribers' )
			?.click();

		// Clicking the active tab still runs the navigate(?tab=undefined) call so
		// stale `subscriber`/`u` params get cleared. No analytics fire from this
		// surface; the route stage owns the tab-view event and dedupes on its end.
		expect( mockNavigate ).toHaveBeenCalledTimes( 1 );
		const navArg = mockNavigate.mock.calls[ 0 ][ 0 ] as { search: Record< string, unknown > };
		expect( navArg.search.tab ).toBeUndefined();
	} );

	it( 'ignores unknown tab values from the underlying Tabs primitive', () => {
		render(
			<NewsletterPage activeTab="subscribers">
				<div>panel body</div>
			</NewsletterPage>
		);

		// Drive `onValueChange` directly with garbage values that the underlying
		// `Tabs.Root` can emit (e.g. `null` while clearing focus, or a
		// stale value from a third-party panel). The shell must short-circuit
		// before navigation runs.
		expect( mockTabsOnValueChange.current ).not.toBeNull();
		mockTabsOnValueChange.current?.( null );
		mockTabsOnValueChange.current?.( 'gibberish' );

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'hides the tab navigation entirely when subscriberManagementEnabled is false', () => {
		mockGetNewsletterScriptData.mockReturnValue( { subscriberManagementEnabled: false } );

		render(
			<NewsletterPage activeTab="settings">
				<div data-testid="settings-content">panel body</div>
			</NewsletterPage>
		);

		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		// The shell still renders the content slot below the page header.
		expect( screen.getByTestId( 'settings-content' ) ).toBeInTheDocument();
	} );

	it( 'hides the footer when hideFooter is true', () => {
		render(
			<NewsletterPage activeTab="subscribers" hideFooter>
				<div>panel body</div>
			</NewsletterPage>
		);

		expect( screen.queryByTestId( 'jetpack-footer' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the footer by default', () => {
		render(
			<NewsletterPage activeTab="subscribers">
				<div>panel body</div>
			</NewsletterPage>
		);

		expect( screen.getByTestId( 'jetpack-footer' ) ).toBeInTheDocument();
	} );
} );

describe( 'NewsletterPage AdminPage wiring', () => {
	it( 'passes the REST API root and nonce from script data to AdminPage', () => {
		// AdminPage's effect calls restApi.setApiRoot(apiRoot); with the default
		// empty apiRoot it would clobber the root and 404 the Settings tab.
		render(
			<NewsletterPage activeTab="subscribers">
				<div>panel body</div>
			</NewsletterPage>
		);

		expect( mockAdminPageProps ).toHaveBeenCalledWith(
			expect.objectContaining( {
				apiRoot: 'https://example.com/wp-json/',
				apiNonce: 'test-nonce',
			} )
		);
	} );
} );
