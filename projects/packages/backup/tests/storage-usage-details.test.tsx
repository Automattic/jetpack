// Tests for the usage readings under the Overview's storage meter
// (JETPACK-2330 / H3b).
//
// The bar itself, and the gate that decides whether any of this renders,
// are covered in `storage-meter.test.tsx`. This file is about what the two
// lines beside it say — the unit the limit is stated in, and the retention
// link that answers "how much history is that actually buying me".

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import StorageSpace from '../src/dashboard/components/storage-space';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const GB = 1024 * 1024 * 1024;
const TB = 1024 * GB;
const SITE = 'example.wordpress.com';

/**
 * Render inside an isolated QueryClient.
 *
 * @param ui - The tree to render.
 * @return The testing-library render result.
 */
function renderWithClient( ui: ReactNode ) {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

/**
 * Answer the two routes the section reads.
 *
 * Defaults to a site holding 10GB of a 100GB plan, with a fortnight of
 * history behind it.
 *
 * @param options          - Overrides.
 * @param options.size     - What `/site/backup/size` returns.
 * @param options.policies - What `/site/backup/policies` returns.
 */
function mockEndpoints( {
	size = {} as Record< string, unknown >,
	policies = {} as Record< string, unknown >,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/policies' ) ) {
			return Promise.resolve( { policies: { storage_limit_bytes: 100 * GB, ...policies } } );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, size: 10 * GB, days_of_backups_saved: 14, ...size } );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * The usage reading, once it has arrived.
 *
 * The copy wraps the used figure in `<strong>`, so the line's own element
 * holds only the fragments either side of it — and those fragments are all
 * Testing Library's text matcher reads. Hence a search for the opening
 * word, and anchored regexes at the call sites: `toHaveTextContent` takes
 * a bare string as a *substring* match, which would pass on a line that
 * had grown an extra clause.
 *
 * @return The element carrying the line.
 */
function usageLine(): Promise< HTMLElement > {
	return screen.findByText( /^Using/ );
}

/**
 * The retention link, once it has arrived.
 *
 * Matched on a fragment of its name rather than the whole of it: `Link`
 * appends an "(opens in a new tab)" image to anything with `openInNewTab`,
 * so the accessible name is never just the copy.
 *
 * @return The anchor.
 */
function retentionLink(): Promise< HTMLElement > {
	return screen.findByRole( 'link', { name: /backups saved/ } );
}

/**
 * The details row's layout container.
 *
 * A layout wrapper carries no role and no accessible name, so its class is
 * the only handle — the same escape hatch `storage-meter.test.tsx` uses to
 * reach the bar's modifier classes. Kept out of the `describe` blocks so
 * the one direct DOM read lives in a single named place.
 *
 * @return The row, or null before it has rendered.
 */
function detailsRow(): HTMLElement | null {
	return document.querySelector( '.jpb-storage-space__details' );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockEndpoints();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
		siteSuffix: SITE,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'the usage reading', () => {
	it( 'states both figures in gigabytes on a plan sold in them', async () => {
		mockEndpoints( { size: { size: 12.4 * GB }, policies: { storage_limit_bytes: 20 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect( usageLine() ).resolves.toHaveTextContent( /^Using 12\.4GB of 20GB$/ );
	} );

	it( 'switches the limit to terabytes once the plan is sold in them', async () => {
		// Usage deliberately stays in gigabytes. A site that has filled
		// whole terabytes is vanishingly rare, and "0.01TB" answers a
		// question nobody asked.
		mockEndpoints( { size: { size: 12.4 * GB }, policies: { storage_limit_bytes: TB } } );
		renderWithClient( <StorageSpace /> );
		await expect( usageLine() ).resolves.toHaveTextContent( /^Using 12GB of 1TB$/ );
	} );

	it( 'reads the bytes as binary multiples, as the plans are sold', async () => {
		// A 10GB plan is 10 * 2^30 bytes. Divide by 10^9 instead and the
		// same plan is advertised back to the reader as 10.7GB.
		mockEndpoints( { size: { size: 5 * GB }, policies: { storage_limit_bytes: 10 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect( usageLine() ).resolves.toHaveTextContent( /^Using 5\.0GB of 10GB$/ );
	} );
} );

describe( 'the usage reading, translated', () => {
	// The English source cannot tell you whether the msgid's placeholders
	// are positional. Nothing moves, so `%1.1f`/`%2f` — which
	// `@tannin/sprintf` reads as widths and fills in the order they appear
	// — renders exactly like `%1$.1f`/`%2$f` at every value. The two only
	// part company under a translation that reorders them, which is the
	// natural phrasing in plenty of languages and is what this covers: it
	// is the only assertion in the suite that fails if the `$` are ever
	// dropped again.
	afterEach( () => {
		// Wipes every domain, which is what this function does — nothing
		// in this file depends on loaded translations, so that is the
		// cheapest way back to a clean slate.
		resetLocaleData();
	} );

	it( 'keeps used and total the right way round when a translation fronts the total', async () => {
		setLocaleData(
			{
				'Using <strong>%1$.1fGB</strong> of %2$fGB': [
					'Of %2$fGB, using <strong>%1$.1fGB</strong>',
				],
				// The pre-fix spelling, carried here on purpose. Without
				// it, reverting the msgid fails this test with "unable to
				// find /^Of/" — a translation that no longer matches any
				// key — which reads as a stale fixture and invites someone
				// to update the key and bless the bug back in. With it, the
				// failure is the transposed figures themselves, which is
				// the thing actually worth seeing.
				'Using <strong>%1.1fGB</strong> of %2fGB': [ 'Of %2fGB, using <strong>%1.1fGB</strong>' ],
			},
			'jetpack-backup-pkg'
		);
		mockEndpoints( { size: { size: 12.4 * GB }, policies: { storage_limit_bytes: 20 * GB } } );
		renderWithClient( <StorageSpace /> );

		// Sequential placeholders would read this as "Of 12.4GB, using
		// 20.0GB" — the site's 20GB plan reported as its usage, and 12.4GB
		// of usage reported as the plan. On the screen whose job is to say
		// whether backups are at risk, that tells a reader with room to
		// spare that they are over quota.
		await expect( screen.findByText( /^Of/ ) ).resolves.toHaveTextContent(
			/^Of 20GB, using 12\.4GB$/
		);
	} );
} );

describe( 'the retention line', () => {
	it( 'reports the days of history behind the meter', async () => {
		mockEndpoints( { size: { days_of_backups_saved: 14 } } );
		renderWithClient( <StorageSpace /> );
		await expect( retentionLink() ).resolves.toHaveTextContent( /^14 days of backups saved$/ );
	} );

	it( 'says "1 day" rather than "1 days"', async () => {
		mockEndpoints( { size: { days_of_backups_saved: 1 } } );
		renderWithClient( <StorageSpace /> );
		await expect( retentionLink() ).resolves.toHaveTextContent( /^1 day of backups saved$/ );
	} );

	it( 'still reports a site that is holding nothing', async () => {
		// Zero is a real answer, and the alarming one — it is what a site
		// whose backups have all been discarded looks like.
		mockEndpoints( { size: { days_of_backups_saved: 0 } } );
		renderWithClient( <StorageSpace /> );
		await expect( retentionLink() ).resolves.toHaveTextContent( /^0 days of backups saved$/ );
	} );

	it( 'says nothing when WordPress.com did not report a day count', async () => {
		// Legacy renders its selector's `null` straight into the plural
		// string and prints "null days of backups saved". Silence is the
		// honest answer.
		mockEndpoints( { size: { days_of_backups_saved: undefined } } );
		renderWithClient( <StorageSpace /> );
		// Awaited first, so this is a real absence rather than an assertion
		// that ran before anything had rendered at all.
		await expect( usageLine() ).resolves.toHaveTextContent( /^Using 10\.0GB of 100GB$/ );
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'scopes the link to this site and opens it away from the dashboard', async () => {
		renderWithClient( <StorageSpace /> );
		const link = await retentionLink();
		expect( link ).toHaveAttribute(
			'href',
			`https://jetpack.com/redirect/?source=backup-plugin-storage-backups-saved&site=${ SITE }`
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'omits the site entirely when the connection global carries no slug', async () => {
		// Not merely cosmetic: `getRedirectUrl` walks its args with `for…in`,
		// so passing the key as undefined encodes the literal string
		// `undefined` *and* suppresses the helper's own site fallback.
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			siteSuffix: undefined,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;
		renderWithClient( <StorageSpace /> );
		await expect( retentionLink() ).resolves.toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=backup-plugin-storage-backups-saved'
		);
	} );
} );

describe( 'the row itself', () => {
	it( 'lays the two readings out as a wrapping, space-between row', async () => {
		// The entire responsive and RTL story, and nothing else asserts it.
		// There is no breakpoint here on purpose — `Stack` writes these as
		// inline styles, so a media query would need `!important` to beat
		// them. Wrapping is what makes the row stack on a narrow viewport,
		// and `space-between` is what puts the wrapped line flush with the
		// start rather than pinned to the end. Flexbox resolves both
		// against the writing direction, which is what keeps the row
		// mirrored in RTL without a second rule.
		mockEndpoints();
		renderWithClient( <StorageSpace /> );

		await waitFor( () => expect( detailsRow() ).not.toBeNull() );
		expect( detailsRow() ).toHaveStyle( {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between',
		} );
	} );

	it( 'separates the readings by the gap legacy stacks them at', async () => {
		// `xs` is 4px, which is what legacy's phone-down rule uses. A
		// larger token would leave the wrapped line floating away from the
		// bar it belongs to.
		mockEndpoints();
		renderWithClient( <StorageSpace /> );

		await waitFor( () => expect( detailsRow() ).not.toBeNull() );

		// The literal fallback is the design system's own: its build injects
		// one into every token reference, so this pins the token *and* the
		// value it currently resolves to. A bump that moves `xs` off 4px
		// should fail here and be looked at rather than land silently.
		expect( detailsRow() ).toHaveStyle( {
			gap: 'var(--wpds-dimension-gap-xs, 4px)',
		} );
	} );
} );

describe( 'loading', () => {
	it( "reserves the row's height alongside the bar's", async () => {
		// Same shift the meter's own placeholder guards: this row is
		// another 28px that would otherwise appear from nowhere and push
		// the activity list down once the two requests land.
		let release: ( v: unknown ) => void = () => {};
		const pending = new Promise( resolve => {
			release = resolve;
		} );
		mockApiFetch.mockImplementation( ( options: { path?: string } ) =>
			( options?.path ?? '' ).includes( '/site/backup/' ) ? pending : Promise.resolve( {} )
		);

		renderWithClient( <StorageSpace /> );

		// The placeholders are `aria-hidden` by design — there is nothing
		// worth announcing yet — so no role or label reaches them and the
		// class is the only handle.
		/* eslint-disable testing-library/no-node-access -- see above. */
		await waitFor( () =>
			expect( document.querySelector( '.jpb-storage-space__details-placeholder' ) ).not.toBeNull()
		);
		/* eslint-enable testing-library/no-node-access */
		expect( screen.queryByText( /^Using/ ) ).not.toBeInTheDocument();

		release( { ok: true, size: 10 * GB, policies: { storage_limit_bytes: 100 * GB } } );
	} );
} );
