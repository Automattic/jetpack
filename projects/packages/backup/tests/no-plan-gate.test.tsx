// JETPACK-2243 H2 — a site without Backup had no way to buy, connect or
// redeem from this page.
//
// The gate was a static notice with a hardcoded `jetpack.com/upgrade/backup/`
// link: not site-scoped, so nothing carried the site through to checkout,
// and the "Use license key" entry point the legacy dashboard put in its
// header was gone entirely.
//
// Also here: the connect link was dead. `admin.php?page=jetpack#/connection`
// does not exist for the standalone Backup plugin, which is the only thing
// that calls `Jetpack_Backup::initialize()` — `page=jetpack` is registered
// there as a `__return_null` placeholder.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( {} ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import NoBackupPlanScreen from '../src/dashboard/components/gates/no-backup-plan';
import NotConnectedScreen from '../src/dashboard/components/gates/not-connected';
import SecondaryAdminScreen from '../src/dashboard/components/gates/secondary-admin';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

const SITE_SUFFIX = 'example.com';

/**
 * Render a gate screen.
 *
 * `screen` is safe for this file, unlike the retry suite next door:
 * every query here is role-based, and `@wordpress/a11y`'s speak region
 * contains no links or buttons to collide with.
 *
 * @param Screen - The screen component.
 */
function renderScreen( Screen: () => JSX.Element ) {
	render(
		<QueryClientProvider>
			<Screen />
		</QueryClientProvider>
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		siteSuffix: SITE_SUFFIX,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'No-plan gate', () => {
	it( 'sends the site through to checkout rather than a generic marketing page', async () => {
		renderScreen( NoBackupPlanScreen );

		const cta = screen.getByRole( 'link', { name: /Upgrade|Backup plans|Get Backup/i } );

		// Site-scoped: without this the reader lands on a page that has no
		// idea which site they came from. And on the redirect service, as
		// the legacy no-plan card used — not a hardcoded jetpack.com URL
		// invented here.
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( SITE_SUFFIX ) );
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( 'jetpack.com/redirect' ) );
	} );

	it( 'offers a way in for someone who already bought a license', async () => {
		renderScreen( NoBackupPlanScreen );

		// Relative, deliberately: `JPBACKUP_INITIAL_STATE` is not emitted
		// on the modernized page, so the absolute `adminUrl` the legacy
		// header used is not available — and does not need to be, since
		// this renders inside wp-admin already.
		expect( screen.getByRole( 'link', { name: /license key/i } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/add-license'
		);
	} );

	it( 'keeps the reader in the same tab', async () => {
		// An upgrade flow that strands the tab it came from is worse, and
		// legacy did not do it either.
		renderScreen( NoBackupPlanScreen );

		for ( const link of screen.getAllByRole( 'link' ) ) {
			expect( link ).not.toHaveAttribute( 'target', '_blank' );
		}
	} );

	it( 'issues no requests', async () => {
		// This screen renders below the capabilities gate, but it must not
		// add fetches of its own — the gates' zero-request property is a
		// deliberate design commitment.
		renderScreen( NoBackupPlanScreen );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );

describe.each( [
	{ name: 'not-connected', Screen: NotConnectedScreen },
	{ name: 'secondary-admin', Screen: SecondaryAdminScreen },
] )( '$name gate', ( { Screen } ) => {
	it( 'points somewhere that exists for the standalone Backup plugin', async () => {
		renderScreen( Screen );

		// `page=jetpack` is a `__return_null` placeholder in the standalone
		// plugin — the link went nowhere. My Jetpack owns connection there.
		const cta = screen.getByRole( 'link', { name: /Connect|Link my account/i } );
		expect( cta ).not.toHaveAttribute( 'href', expect.stringContaining( 'page=jetpack#' ) );
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( 'page=my-jetpack' ) );
	} );

	it( 'offers the license-key path too', async () => {
		// Legacy showed it whenever the site was not fully connected, not
		// only on the no-plan screen — see `useShowActivateLicenseLink`.
		renderScreen( Screen );
		expect( screen.getByRole( 'link', { name: /license key/i } ) ).toBeInTheDocument();
	} );
} );
