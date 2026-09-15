// JETPACK-2243 H2 — a site without Backup had no way to buy, connect or
// redeem from this page.
//
// The gate was a static notice with a hardcoded `jetpack.com/upgrade/backup/`
// link: not site-scoped, so nothing carried the site through to checkout,
// and the "Use license key" entry point the legacy dashboard put in its
// header was gone entirely.
//
// Also here: the connect link reached no connection screen.
// `admin.php?page=jetpack` is a `__return_null` placeholder without the
// Jetpack plugin, and the Jetpack React app with it — and that app has no
// `/connection` route, so the hash bounced to `#/dashboard`.
//
// And the screen never said what Backup costs, so the only way to find out
// was to press a button labelled "Get VaultPress Backup" and see where it
// led. The price comes from the product catalogue, which prices per site —
// so these tests assert that the currency travels with the amount.

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
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

const SITE_SUFFIX = 'example.com';

/**
 * A catalogue entry as WordPress.com actually ships it, currency and all.
 *
 * BRL rather than USD on purpose: the catalogue prices from where the
 * site appears to be, so a fixture in dollars would let a hardcoded `$`
 * pass. `cost` is the yearly term price — the promoted product is a
 * yearly one — and the offer's interval is a year, which is what makes
 * dividing it by twelve correct here and wrong for a monthly one.
 */
const PRICED_PRODUCT = {
	cost: 539.4,
	currency_code: 'BRL',
	introductory_offer: {
		interval_unit: 'year',
		interval_count: 1,
		cost_per_interval: 275.4,
	},
};

const PRICE_PATH = '/jetpack/v4/backup-promoted-product-info';

/**
 * The full price and nothing else — which is the struck-through element,
 * since the visually-hidden renewal line wraps the same figure in words.
 * Anchored so it cannot also match that sentence, and spelled with `R$`
 * so it doubles as a check that the fixture's currency reached the DOM.
 */
const PRICE_ALONE = /^R\$\s?44[.,]95$/;

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
	// The price query would otherwise be answered from the previous
	// test's cache: the client is a module singleton and the price is
	// held for an hour, so without this the first test to resolve it
	// decides what every later one sees.
	queryClient.clear();
	// Default to a catalogue that answers with nothing, so the tests that
	// are not about the price render without one.
	mockApiFetch.mockResolvedValue( null );

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		siteSuffix: SITE_SUFFIX,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'No-plan gate', () => {
	it( 'sends the site through to checkout rather than a generic marketing page', async () => {
		renderScreen( NoBackupPlanScreen );

		const cta = await screen.findByRole( 'link', { name: /^Get VaultPress Backup$/ } );

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
		await expect(
			screen.findByRole( 'link', { name: /^Use license key$/ } )
		).resolves.toHaveAttribute( 'href', 'admin.php?page=my-jetpack#/add-license' );
	} );

	it( 'omits the site rather than sending the word "undefined"', async () => {
		// `getRedirectUrl` walks its args with `for…in`, so a key that is
		// present-but-undefined is encoded rather than skipped — and its
		// presence also suppresses the helper's own site fallback. Passing
		// no key at all is the only way to degrade cleanly.
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: undefined,
		} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;

		renderScreen( NoBackupPlanScreen );

		await expect(
			screen.findByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).resolves.not.toHaveAttribute( 'href', expect.stringContaining( 'undefined' ) );
	} );

	it( 'keeps the reader in the same tab', async () => {
		// An upgrade flow that strands the tab it came from is worse, and
		// legacy did not do it either.
		renderScreen( NoBackupPlanScreen );
		await expect(
			screen.findByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).resolves.toBeInTheDocument();

		for ( const link of screen.getAllByRole( 'link' ) ) {
			expect( link ).not.toHaveAttribute( 'target', '_blank' );
		}
	} );

	it( 'asks for the price and nothing else', async () => {
		// This screen used to issue no requests at all, and the other two
		// gates still do not. The price is the one thing worth fetching
		// here: it is the only request on this screen whose answer the
		// reader can act on, which is the same test JETPACK-2322 applies
		// to the four the Overview issues behind this gate.
		renderScreen( NoBackupPlanScreen );
		await expect(
			screen.findByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).resolves.toBeInTheDocument();

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch ).toHaveBeenCalledWith( expect.objectContaining( { path: PRICE_PATH } ) );
	} );

	it( 'shows the monthly price in the currency the catalogue named', async () => {
		mockApiFetch.mockResolvedValue( { ...PRICED_PRODUCT, introductory_offer: null } );

		renderScreen( NoBackupPlanScreen );

		// 539.40 a year is 44.95 a month. The figure the reader compares
		// against competitors is the monthly one, which is why the screen
		// divides rather than showing the term price.
		const price = await screen.findByText( /44[.,]95/ );

		// Rendered from `currency_code`, not from a symbol written here.
		// The legacy screen hardcodes `$` in one of its price strings,
		// which is wrong for every site this fixture represents.
		expect( price ).toHaveTextContent( 'R$' );
		expect( screen.getByText( '14 day money back guarantee.' ) ).toBeInTheDocument();
	} );

	it( 'leads with the introductory price and explains the renewal', async () => {
		mockApiFetch.mockResolvedValue( PRICED_PRODUCT );

		renderScreen( NoBackupPlanScreen );

		// 275.40 for the first year is 22.95 a month; 44.95 after it.
		await expect( screen.findByText( /22[.,]95/ ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( PRICE_ALONE ) ).toBeInTheDocument();

		// Two amounts on screen is only honest if the screen says which
		// one recurs.
		expect( screen.getByText( /all renewals are at full price/ ) ).toBeInTheDocument();
	} );

	it( 'does not read the superseded price out as a second price', async () => {
		// A strikethrough is invisible to a screen reader, so announcing
		// both amounts gives two prices and no way to tell which is
		// charged.
		mockApiFetch.mockResolvedValue( PRICED_PRODUCT );

		renderScreen( NoBackupPlanScreen );
		await expect( screen.findByText( /Renews at/ ) ).resolves.toBeInTheDocument();

		expect( screen.getByText( PRICE_ALONE ) ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'still tells assistive tech what the price renews at', async () => {
		// Hiding the strikethrough is only half the fix. "All renewals are
		// at full price" says a full price exists and never says what it
		// is, so hiding the only place the figure appears would leave a
		// screen reader with strictly fewer facts than a sighted reader —
		// on the screen whose entire job is to inform a purchase.
		mockApiFetch.mockResolvedValue( PRICED_PRODUCT );

		renderScreen( NoBackupPlanScreen );

		const renewal = await screen.findByText( /Renews at .*44[.,]95 per month/ );
		expect( renewal ).not.toHaveAttribute( 'aria-hidden' );
	} );

	it( 'says nothing about renewal when there is no introductory offer', async () => {
		// One price, nothing superseded, nothing to explain.
		mockApiFetch.mockResolvedValue( { ...PRICED_PRODUCT, introductory_offer: null } );

		renderScreen( NoBackupPlanScreen );

		await expect( screen.findByText( /44[.,]95/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Renews at/ ) ).not.toBeInTheDocument();
	} );

	it( 'converts a monthly introductory offer by its own interval', async () => {
		// The legacy screen divides `cost_per_interval` by twelve whatever
		// the interval is, so a monthly offer renders at a twelfth of what
		// it costs. Here the offer is 9.99 for one month, and 9.99 is what
		// must appear — not 0.83.
		mockApiFetch.mockResolvedValue( {
			...PRICED_PRODUCT,
			introductory_offer: {
				interval_unit: 'month',
				interval_count: 1,
				cost_per_interval: 9.99,
			},
		} );

		renderScreen( NoBackupPlanScreen );

		await expect( screen.findByText( /9[.,]99/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /0[.,]83/ ) ).not.toBeInTheDocument();
	} );

	it( 'still offers the purchase path when the catalogue cannot be read', async () => {
		// This screen is the only way a site without Backup can buy one.
		// A catalogue that is down may cost the reader the price; it must
		// not cost them the button.
		mockApiFetch.mockRejectedValue( new Error( 'catalogue unavailable' ) );

		renderScreen( NoBackupPlanScreen );

		await expect(
			screen.findByRole( 'link', { name: /^Get VaultPress Backup$/ } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /per month, billed yearly/ ) ).not.toBeInTheDocument();
	} );
} );

describe.each( [
	{ name: 'not-connected', Screen: NotConnectedScreen },
	{ name: 'secondary-admin', Screen: SecondaryAdminScreen },
] )( '$name gate', ( { Screen } ) => {
	it( 'points somewhere that actually reaches a connection screen', async () => {
		renderScreen( Screen );

		// `page=jetpack#/connection` reached a connection screen on no site
		// that could see it. My Jetpack owns connection for these plugins.
		const cta = screen.getByRole( 'link', { name: /Connect|Link my account/i } );
		expect( cta ).not.toHaveAttribute( 'href', expect.stringContaining( 'page=jetpack#' ) );
		expect( cta ).toHaveAttribute( 'href', expect.stringContaining( 'page=my-jetpack' ) );
	} );

	it( 'offers the license-key path too', async () => {
		// Legacy showed it whenever the site was not fully connected, not
		// only on the no-plan screen — see `useShowActivateLicenseLink`.
		renderScreen( Screen );
		expect( screen.getByRole( 'link', { name: /^Use license key$/ } ) ).toBeInTheDocument();
	} );

	it( 'issues no requests', async () => {
		// The no-plan screen fetches a price; these two must not fetch
		// anything. Neither reader can buy from where they are standing —
		// one has no connection and the other is not the connected user —
		// so a price would be an answer to a question they cannot ask yet.
		renderScreen( Screen );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
