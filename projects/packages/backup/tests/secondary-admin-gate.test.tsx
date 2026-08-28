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
// Jetpack connection." — with no actions at all. Its priced
// `NoBackupCapabilities` upsell needs a non-null capabilities array and
// so was unreachable on this path. So the purchase path here is new, not
// restored, which is why it is pinned rather than assumed.
//
// The fix is the screen, not the gate. It carries both ways forward, and
// every claim it makes leads with its condition.
//
// Which is why the price the no-plan screen shows is not here: the
// upgrade link costs nothing to render, and the zero-request guarantee
// this screen is built on — pinned in `stages.test.tsx` and
// `gate-decision.test.tsx` — is worth more than a figure.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { render, screen } from '@testing-library/react';
import SecondaryAdminScreen from '../src/dashboard/components/gates/secondary-admin';

const SITE_SUFFIX = 'example.com';

/**
 * Point `useSiteSuffix` at a site slug, or at none.
 *
 * @param siteSuffix - The slug PHP would emit, or undefined.
 */
function setSiteSuffix( siteSuffix: string | undefined ) {
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		siteSuffix,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
}

beforeEach( () => {
	mockApiFetch.mockReset();
	setSiteSuffix( SITE_SUFFIX );
} );

describe( 'Secondary-admin gate', () => {
	it( 'offers the purchase path a plan-less site needs', () => {
		render( <SecondaryAdminScreen /> );

		const cta = screen.getByRole( 'link', { name: /^Get VaultPress Backup$/ } );

		// The same destination the no-plan screen uses: the redirect
		// service, site-scoped, so checkout knows which site it is for.
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( 'jetpack.com/redirect' ) );
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( SITE_SUFFIX ) );
	} );

	it( 'keeps account linking as the primary action beside it', () => {
		// The upsell is an addition, not a replacement, and it is the
		// junior of the two: a secondary admin on a site that *does* have
		// a plan still has to link an account, and this screen cannot tell
		// which reader it is talking to. Promoting the upgrade button over
		// the link would sell a plan to someone who already has one.
		//
		// Asserted because nothing else would notice. The two variants are
		// one word apart in the source and the argument for this ordering
		// lives only in a docblock, which no test reads.
		render( <SecondaryAdminScreen /> );

		const link = screen.getByRole( 'link', { name: /^Link my account$/ } );
		const upgrade = screen.getByRole( 'link', { name: /^Get VaultPress Backup$/ } );

		expect( link ).toHaveClass( 'is-primary' );
		expect( upgrade ).not.toHaveClass( 'is-primary' );
	} );

	it( 'leads with the condition rather than promising backups outright', () => {
		// The screen does not know whether the site has a plan, so an
		// unconditional "you'll see this site's backups" is false for half
		// its readers — and a hedge that arrives in the next sentence does
		// not retract a flat claim in this one. Both halves are pinned:
		// the conditional reading of what linking gets you, and the
		// sentence naming the no-plan case that makes the upgrade button
		// below something other than a non-sequitur.
		render( <SecondaryAdminScreen /> );

		expect(
			screen.getByText( /Once your account is linked, you'll see any backups this site has/ )
		).toBeInTheDocument();
		expect( screen.getByText( /doesn't have an active Backup plan/ ) ).toBeInTheDocument();
	} );

	it( 'omits the site rather than sending the word "undefined"', () => {
		// `getRedirectUrl` walks its args with `for…in`, so a
		// present-but-undefined `site` is encoded as the literal string
		// `undefined`, and its presence also suppresses the helper's own
		// site fallback. Passing no key at all is the only clean degrade.
		setSiteSuffix( undefined );

		render( <SecondaryAdminScreen /> );

		expect( screen.getByRole( 'link', { name: /^Get VaultPress Backup$/ } ) ).not.toHaveAttribute(
			'href',
			expect.stringContaining( 'undefined' )
		);
	} );

	it( 'keeps the reader in the same tab', () => {
		// Same as the no-plan screen: a flow that opens a new tab strands
		// the page the reader started from.
		render( <SecondaryAdminScreen /> );

		for ( const link of screen.getAllByRole( 'link' ) ) {
			expect( link ).not.toHaveAttribute( 'target', '_blank' );
		}
	} );

	it( 'buys its way forward without a single request', () => {
		// Rendered with no `QueryClientProvider` in scope on purpose. A
		// screen that gained a query hook would throw "No QueryClient set"
		// here rather than quietly passing an `apiFetch` assertion that a
		// mocked-away network makes cheap — which is the failure mode the
		// zero-request guarantee actually has.
		render( <SecondaryAdminScreen /> );

		expect( screen.getByRole( 'link', { name: /^Get VaultPress Backup$/ } ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
