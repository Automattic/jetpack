// JETPACK-2311 H4 — a secondary admin on a site with no Backup plan had
// no way forward.
//
// The gate answers `secondary-admin` from connection state alone, before
// anything is known about the plan, and deliberately so: without a user
// connection the capabilities bridge can only answer 403, so asking is
// not an option. This screen therefore never learns whether the site has
// a plan — and it used to assume one, telling the reader to link an
// account to view backups and offering no other way off the page. On a
// plan-less site that promised backups that do not exist and led to a
// linked account that still shows nothing.
//
// Legacy did not do better: a secondary admin there fell through to
// `LoadedState`, `useCapabilities` set `capabilitiesError = 'is_unlinked'`
// because the request 403s without a user token, and the screen was a
// bare `<h2>` — "Site backups are managed by the owner of this site's
// Jetpack connection." — with no actions at all.
//
// The fix is the screen, not the gate: every claim it makes now leads
// with its condition.
//
// A purchase button here was considered and rejected. Checkout requires a
// linked connection, so it would have handed this reader a flow they
// cannot finish — the same broken promise, moved from the copy into a
// button. Linking is the real way forward for both readers, and a
// plan-less site reaches the no-plan gate's working upsell straight
// after. Its absence is pinned below, because nothing else would notice
// it coming back.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { render, screen } from '@testing-library/react';
import SecondaryAdminScreen from '../src/dashboard/components/gates/secondary-admin';

const SITE_SUFFIX = 'example.com';

beforeEach( () => {
	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		siteSuffix: SITE_SUFFIX,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'Secondary-admin gate', () => {
	it( 'offers no purchase action, because this reader cannot complete one', () => {
		// Checkout needs a linked WordPress.com connection, which is
		// precisely what this reader does not have. A "Get VaultPress
		// Backup" button here would send them to a flow that stops partway
		// and returns them to this same screen.
		render( <SecondaryAdminScreen /> );

		// The outside witness. Without it every absence below would pass
		// just as well on a screen that rendered nothing at all, which is
		// the way this kind of test usually rots.
		expect( screen.getByRole( 'link', { name: /^Link my account$/ } ) ).toBeInTheDocument();

		expect(
			screen.queryByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).not.toBeInTheDocument();

		// By destination as well as by label, so a purchase affordance
		// cannot come back under a different name.
		for ( const link of screen.getAllByRole( 'link' ) ) {
			expect( link ).not.toHaveAttribute(
				'href',
				expect.stringContaining( 'jetpack.com/redirect' )
			);
		}
	} );

	it( 'leads with the condition rather than promising backups outright', () => {
		// The screen does not know whether the site has a plan, so an
		// unconditional "you'll see this site's backups" is false for half
		// its readers — and a hedge that arrives in the next sentence does
		// not retract a flat claim in this one.
		//
		// Both halves are pinned: the conditional reading of what linking
		// gets you, and the sentence naming the no-plan case. The second
		// matters more now than it did when a button sat below it — with
		// no upsell on this screen, it is the only thing telling a reader
		// on a plan-less site that linking is not the last step.
		render( <SecondaryAdminScreen /> );

		expect(
			screen.getByText( /Once your account is linked, you'll see any backups this site has/ )
		).toBeInTheDocument();
		expect( screen.getByText( /doesn't have an active Backup plan/ ) ).toBeInTheDocument();
	} );

	it( 'renders without a single request', () => {
		// Rendered with no `QueryClientProvider` in scope on purpose. A
		// screen that gained a query hook would throw "No QueryClient set"
		// here rather than quietly passing an `apiFetch` assertion that a
		// mocked-away network makes cheap — which is the failure mode the
		// zero-request guarantee actually has.
		render( <SecondaryAdminScreen /> );

		expect( screen.getByRole( 'link', { name: /^Link my account$/ } ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
