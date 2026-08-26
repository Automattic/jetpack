// Tests for the Overview's storage section (JETPACK-2300 / H3a).
//
// The level derivation itself is unit-tested in
// `src/dashboard/data/test/storage-usage-levels.test.ts`; this file covers
// what the two routes together produce, and above all when the section
// declines to render.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import BackupNowButton from '../src/dashboard/components/backup-now-button';
import StorageSpace from '../src/dashboard/components/storage-space';
import type { ReactNode } from 'react';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const GB = 1024 * 1024 * 1024;

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
 * Answer the two routes the meter reads.
 *
 * Both default to a healthy site well under its limit. `null` for either
 * response stands for the bridges' failure shape — a bare `null` body
 * served as HTTP 200.
 *
 * @param options          - Overrides.
 * @param options.size     - What `/site/backup/size` returns.
 * @param options.policies - What `/site/backup/policies` returns.
 */
function mockEndpoints( {
	size = {} as Record< string, unknown > | null,
	policies = {} as Record< string, unknown > | null,
} = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/backup/policies' ) ) {
			return Promise.resolve(
				policies === null ? null : { policies: { storage_limit_bytes: 100 * GB, ...policies } }
			);
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( size === null ? null : { ok: true, size: 10 * GB, ...size } );
		}
		// `<BackupNowButton>` shares the `/size` read and appears in two
		// of the tests below; these are the other routes it needs before
		// it will render at all.
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/backups' ) ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * The rendered meter's fill percentage.
 *
 * `ProgressBar` carries the value on a visually-hidden `<progress>`,
 * whose implicit role is `progressbar` — so this is also a check that the
 * bar is exposed to assistive technology at all.
 *
 * @return The value as a number, or null when no bar rendered.
 */
function meterValue(): number | null {
	const bar = screen.queryByRole( 'progressbar' );
	return bar ? Number( bar.getAttribute( 'value' ) ) : null;
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockEndpoints();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'the render gate', () => {
	it( 'draws a meter once both a usage figure and a limit have arrived', async () => {
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage space' ) ).resolves.toBeInTheDocument();
		expect( meterValue() ).toBe( 10 );
	} );

	it( "holds the section's height while the requests are in flight", async () => {
		// The shift this guards: the section used to render `null` until
		// both requests resolved, so on a slow connection the activity list
		// rendered first and was then pushed down when they landed.
		let release: ( v: unknown ) => void = () => {};
		const pending = new Promise( resolve => {
			release = resolve;
		} );
		mockApiFetch.mockImplementation( ( options: { path?: string } ) =>
			( options?.path ?? '' ).includes( '/site/backup/' ) ? pending : Promise.resolve( {} )
		);

		renderWithClient( <StorageSpace /> );

		// The placeholders are `aria-hidden` by design — there is nothing
		// worth announcing yet — so no role or label reaches them, and the
		// class is the only handle. Same escape hatch as `barModifiers()`.
		/* eslint-disable testing-library/no-node-access -- see above. */
		await waitFor( () => expect( document.querySelector( '.jpb-storage-space' ) ).not.toBeNull() );
		expect( document.querySelector( '.jpb-storage-meter__placeholder' ) ).not.toBeNull();
		/* eslint-enable testing-library/no-node-access */
		// Nothing is claimed while we are still looking.
		expect( screen.queryByText( 'Cloud storage space' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();

		release( { ok: true, size: 10 * GB, policies: { storage_limit_bytes: 100 * GB } } );
	} );

	it( 'stays silent when the policies read fails, rather than drawing an empty bar', async () => {
		// The dangerous case. `/policies` answering a non-200 arrives as a
		// bare `null` with HTTP 200, so nothing rejects and nothing here
		// gets to see an error — only the missing limit says so.
		mockEndpoints( { policies: null } );
		renderWithClient( <StorageSpace /> );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( screen.queryByText( 'Cloud storage space' ) ).not.toBeInTheDocument();
		expect( meterValue() ).toBeNull();
	} );

	it( 'stays silent for a site whose plan carries no retention policy', async () => {
		// `{ policies: null }` inside a 200 is a different thing from a
		// failed read, and produces the same silence for a different
		// reason: there is no limit to measure against.
		mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/backup/policies' ) ) {
				return Promise.resolve( { policies: null } );
			}
			return Promise.resolve( { ok: true, size: 10 * GB } );
		} );
		renderWithClient( <StorageSpace /> );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( screen.queryByText( 'Cloud storage space' ) ).not.toBeInTheDocument();
	} );

	it( 'stays silent on a zero limit rather than reading it as 100% full', async () => {
		mockEndpoints( { policies: { storage_limit_bytes: 0 } } );
		renderWithClient( <StorageSpace /> );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( screen.queryByText( 'Cloud storage full' ) ).not.toBeInTheDocument();
		expect( meterValue() ).toBeNull();
	} );

	it( 'discards the size response entirely when WordPress.com says `ok: false`', async () => {
		// The sibling fields carry no meaning without it, so a size of
		// zero must not be read as "you have used none of your storage".
		mockEndpoints( { size: { ok: false, size: 0 } } );
		renderWithClient( <StorageSpace /> );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( meterValue() ).toBeNull();
	} );
} );

describe( 'the section heading', () => {
	it( 'escalates to "almost full" past 80%', async () => {
		mockEndpoints( { size: { size: 85 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect(
			screen.findByText( 'Cloud storage is almost full' )
		).resolves.toBeInTheDocument();
	} );

	it( 'escalates to "full" at the limit', async () => {
		mockEndpoints( { size: { size: 100 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage full' ) ).resolves.toBeInTheDocument();
	} );

	it( 'stays calm at "BackupsDiscarded", which is not a fullness reading', async () => {
		// Half full by bytes, but retention has already been cut short.
		// The heading is driven by fullness, so this one keeps the neutral
		// wording — the sibling upsell issue is what reports it.
		mockEndpoints( {
			size: {
				size: 50 * GB,
				min_days_of_backups_allowed: 7,
				days_of_backups_allowed: 7,
				days_of_backups_saved: 7,
				retention_days: 30,
			},
		} );
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage space' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'colour and geometry', () => {
	/**
	 * The modifier classes on the bar, which are the contract between
	 * `meter.tsx` and `style.scss`.
	 *
	 * @return The class list, or null when no bar rendered.
	 */
	function barModifiers(): string[] | null {
		// eslint-disable-next-line testing-library/no-node-access -- The class list is the thing under test; no role or label exposes it.
		const bar = document.querySelector( '.jpb-storage-meter__bar' );
		return bar ? Array.from( bar.classList ) : null;
	}

	it( 'takes the full-width geometry only when the bar actually reaches the end', async () => {
		mockEndpoints( { size: { size: 100 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage full' ) ).resolves.toBeInTheDocument();
		expect( barModifiers() ).toContain( 'jpb-storage-meter__bar--complete' );
	} );

	it( 'keeps the flat trailing edge at BackupsDiscarded, which fires at any fill level', async () => {
		// The regression this guards: geometry used to be keyed off the
		// level name, and `BackupsDiscarded` shares `Full`'s alarm colour.
		// A half-full bar was therefore drawn as a fully-rounded pill
		// floating in the track — the exact shape the partly-filled
		// treatment exists to avoid. Colour is shared; geometry is not.
		mockEndpoints( {
			size: {
				size: 50 * GB,
				min_days_of_backups_allowed: 7,
				days_of_backups_allowed: 7,
				days_of_backups_saved: 7,
				retention_days: 30,
			},
		} );
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage space' ) ).resolves.toBeInTheDocument();
		expect( barModifiers() ).toContain( 'jpb-storage-meter__bar--error' );
		expect( barModifiers() ).not.toContain( 'jpb-storage-meter__bar--complete' );
	} );

	it.each( [
		[ 10, 'jpb-storage-meter__bar--neutral' ],
		[ 70, 'jpb-storage-meter__bar--caution' ],
		[ 85, 'jpb-storage-meter__bar--error' ],
	] )( 'fills %i%% with %s', async ( percent, expected ) => {
		mockEndpoints( { size: { size: percent * GB } } );
		renderWithClient( <StorageSpace /> );
		await waitFor( () => expect( barModifiers() ).not.toBeNull() );
		expect( barModifiers() ).toContain( expected );
	} );
} );

describe( 'landmarks', () => {
	it( 'exposes the section as a named region, not a bare container', async () => {
		// `<section>` maps to `region` only when it has an accessible name.
		// Without one a screen reader cannot jump to the answer to "why did
		// my backups stop". Querying by name also proves the `id` survives
		// `<Text render={ … } />`, which is what `aria-labelledby` points at.
		renderWithClient( <StorageSpace /> );
		await expect(
			screen.findByRole( 'region', { name: 'Cloud storage space' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'puts the heading at level 3, level with its siblings', async () => {
		// Deliberately not legacy's `h2`. The backup and activity detail
		// cards are `h3` and are visual siblings of this section, so an
		// `h2` here would read as though they were nested inside cloud
		// storage.
		renderWithClient( <StorageSpace /> );
		await expect(
			screen.findByRole( 'heading', { level: 3, name: 'Cloud storage space' } )
		).resolves.toBeInTheDocument();
	} );
} );

describe( 'the meter itself', () => {
	it( 'clamps a site holding more than its limit to a full bar', async () => {
		mockEndpoints( { size: { size: 150 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect( screen.findByText( 'Cloud storage full' ) ).resolves.toBeInTheDocument();
		expect( meterValue() ).toBe( 100 );
	} );

	// Caveat worth knowing: the dashboard route externalizes
	// `@wordpress/components` to the `wp-components` handle, so the
	// `<ProgressBar>` that runs in wp-admin is WordPress core's, not the
	// version pinned here and resolved by jest. This asserts the override
	// against the pinned copy. It holds because the implementation spreads
	// caller props *after* its own hardcoded `aria-label="Loading …"` —
	// prop-spread ordering, which is not a documented contract. If core
	// ever reverses it the meter silently goes back to announcing itself as
	// a loading indicator and this test will not notice.
	it( 'labels itself as storage rather than inheriting ProgressBar’s "Loading" label', async () => {
		mockEndpoints( { size: { size: 42 * GB } } );
		renderWithClient( <StorageSpace /> );
		await expect(
			screen.findByLabelText( 'Backup storage used: 42%' )
		).resolves.toBeInTheDocument();
	} );

	it( 'shares one `/size` read with the other consumer on the page', async () => {
		// `<BackupNowButton>` reads the same route for the server-side
		// `backups_stopped` flag. Both go through `useSiteSizeQuery`, so
		// the Overview issues one request for the two of them.
		renderWithClient(
			<>
				<StorageSpace />
				<BackupNowButton />
			</>
		);
		await expect( screen.findByText( 'Cloud storage space' ) ).resolves.toBeInTheDocument();
		const paths = mockApiFetch.mock.calls.map( ( [ o ] ) => o?.path );
		expect( paths.filter( p => p?.includes( '/site/backup/size' ) ) ).toHaveLength( 1 );
		expect( paths.filter( p => p?.includes( '/site/backup/policies' ) ) ).toHaveLength( 1 );
	} );

	it( 'leaves the cached `/size` entry alone when the second consumer mounts later', async () => {
		// The above passes however the two hooks are written: React Query
		// dedupes observers that mount together, whatever options they
		// each carry. What the shared definition actually buys is this —
		// a consumer arriving *after* the entry is cached honours the same
		// `staleTime` and does not refetch. Give the two different values
		// and this is the test that notices.
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		} );

		const view = render(
			<QueryClientProvider client={ client }>
				<StorageSpace />
			</QueryClientProvider>
		);
		await expect( screen.findByText( 'Cloud storage space' ) ).resolves.toBeInTheDocument();
		view.unmount();

		render(
			<QueryClientProvider client={ client }>
				<BackupNowButton />
			</QueryClientProvider>
		);
		await expect( screen.findByRole( 'button' ) ).resolves.toBeInTheDocument();

		const sizeCalls = mockApiFetch.mock.calls
			.map( ( [ o ] ) => o?.path )
			.filter( ( path?: string ) => path?.includes( '/site/backup/size' ) );
		expect( sizeCalls ).toHaveLength( 1 );
	} );
} );
