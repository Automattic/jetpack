const mockApiFetch = jest.fn();
const mockSpeak = jest.fn();
let mockRewindId = '1786663613.9425';

jest.mock( '@wordpress/a11y', () => ( {
	speak: ( ...args: unknown[] ) => mockSpeak( ...args ),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: mockRewindId } ),
	Link: jest
		.requireActual( 'react' )
		.forwardRef(
			(
				{ children, to, ...rest }: { children: React.ReactNode; to: string },
				ref: React.Ref< HTMLAnchorElement >
			) => (
				<a ref={ ref } href={ to } { ...rest }>
					{ children }
				</a>
			)
		),
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ANNOUNCE_WINDOW_MS, resetAnnouncerForTesting } from '../src/dashboard/data/announce';
import { KNOWN_THREATS_TIMEOUT_MS } from '../src/dashboard/data/api/known-threats';
import { formatDateTime } from '../src/dashboard/data/date-format';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import RestoreScreen from '../src/dashboard/screens/restore';

const REWIND_ID = '1786663613.9425';
const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const CONFIRM = /Confirm restore/;
const ACKNOWLEDGE =
	'I understand this backup contains known threats and want to restore it anyway.';
const WARNING =
	'This backup is known to contain 2 security threats. Restoring it may bring malware back to your site.';
const CHECKING = /Checking this backup for known threats/;
const REFUSAL = 'This backup is known to contain security threats. Acknowledge them to restore it.';

const FLAGGED = {
	backup_id: REWIND_ID,
	cutoff: '2026-08-10T00:00:00+00:00',
	summary: { malware: 1, database: 1, vulnerable: 1, ignored: 0, flagged: 2, fixed: 1 },
	threats: [
		{
			id: 11,
			state: 'open',
			kind: 'malware',
			signature: 'PHP.Backdoor.Generic',
			path_kind: 'file',
			type: 'file',
			target: '/srv/htdocs/wp-content/uploads/x.php',
			path: 'wp-content/uploads/x.php',
			status: 'current',
			// UTC with no zone, as WordPress.com sends it.
			reported_on: '2026-10-17 01:30:00',
			fixed_on: null,
		},
		{
			id: 12,
			state: 'fixed',
			kind: 'database',
			signature: null,
			path_kind: 'database',
			type: 'database',
			target: 'wp_options',
			status: 'fixed',
			reported_on: '2026-10-17 12:00:00',
			fixed_on: '2026-10-18 02:00:00',
		},
		{
			id: 13,
			state: 'open',
			kind: 'vulnerable',
			signature: 'Vulnerable.WP.Extension',
			path_kind: 'plugin',
			type: 'plugin',
			target: 'old-plugin',
			slug: 'old-plugin',
			version: '1.0',
			status: 'current',
			reported_on: '2026-08-03T12:00:00+00:00',
			fixed_on: null,
		},
	],
	count: 3,
	truncated: false,
};

const CLEAN = { ...FLAGGED, summary: { ...FLAGGED.summary, malware: 0, database: 0, flagged: 0 } };

type Options = { path?: string; method?: string; data?: Record< string, unknown > };

/**
 * Route each request by path.
 *
 * @param threats  - What the known-threats route does.
 * @param initiate - What the restore POST does; resolves with a restore id by default.
 */
function arrange(
	threats: () => Promise< unknown >,
	initiate: () => Promise< unknown > = () => Promise.resolve( { id: 912682, rewind_id: REWIND_ID } )
) {
	mockApiFetch.mockImplementation( ( options: Options ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: true } );
		}
		if ( path.includes( '/rewind/backups/known-threats' ) ) {
			return Promise.resolve( {
				backups: [],
				latest_without_known_threats: 1792200000,
				latest_without_known_threats_rewind_id: path.includes( 'with_clean_rewind_id=true' )
					? '1792200135.5'
					: null,
			} );
		}
		if ( path.includes( '/threats' ) ) {
			return threats();
		}
		if ( options?.method === 'POST' ) {
			return initiate();
		}
		if ( path.includes( '/restores' ) ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( { id: 912682, status: 'running', progress: 10 } );
	} );
}

/**
 * The bodies of every restore POST so far.
 *
 * @return The request bodies.
 */
function postedBodies(): Record< string, unknown >[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ]: [ Options ] ) => options )
		.filter( options => options?.method === 'POST' )
		.map( options => options.data ?? {} );
}

/**
 * Render the screen, scoped away from `@wordpress/a11y`'s speak region.
 *
 * @return The rendered container.
 */
function renderScreen(): HTMLElement {
	const { container } = render(
		<QueryClientProvider>
			<RestoreScreen />
		</QueryClientProvider>
	);
	return container;
}

/**
 * Wait until Confirm can be pressed.
 *
 * @param confirm - The Confirm button.
 * @return The same button.
 */
async function enabled( confirm: HTMLElement ): Promise< HTMLElement > {
	await waitFor( () => expect( confirm ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	return confirm;
}

beforeEach( () => {
	resetAnnouncerForTesting();
	mockSpeak.mockReset();
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	window.JPBACKUP_DASHBOARD_STATE = { knownThreatsAvailable: true };
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'known threats on the Restore screen', () => {
	it( 'shows the warning and requires the checkbox for a flagged backup', async () => {
		let answer: ( value: unknown ) => void = () => {};
		arrange( () => new Promise( resolve => ( answer = resolve ) ) );
		const user = userEvent.setup();
		const view = within( renderScreen() );

		const pending = await view.findByRole( 'button', { name: CONFIRM } );
		expect( pending ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( pending ).toHaveAccessibleDescription( CHECKING );

		await act( async () => answer( { ...FLAGGED, count: 5, truncated: true } ) );
		await expect( view.findByText( WARNING ) ).resolves.toBeInTheDocument();
		const confirm = view.getByRole( 'button', { name: CONFIRM } );
		expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( confirm ).toHaveAccessibleDescription( /known threats/ );
		// Shown beside the button, not only in its description.
		expect( view.getByText( /confirm that you understand/ ) ).not.toHaveClass(
			'jpb-visually-hidden'
		);

		const toggle = view.getByRole( 'button', { name: 'Show threats' } );
		// The warning already says how many threats there are, so no badge repeats it.
		expect( view.queryByText( 'Known threats (2)' ) ).not.toBeInTheDocument();
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await user.click( toggle );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( toggle ).toHaveAccessibleName( 'Hide threats' );
		const items = within(
			view.getByRole( 'list', { name: 'Known threats in this backup' } )
		).getAllByRole( 'listitem' );
		// In the site's own date format and timezone, like the dashboard's other dates.
		expect( items.map( item => item.textContent ) ).toEqual( [
			'PHP.Backdoor.Generic' +
				'wp-content/uploads/x.php' +
				'First detected October 17, 2026 · Open',
			'Database threat' + 'wp_options' + 'First detected October 17, 2026 · Fixed October 18, 2026',
		] );
		expect( view.getByText( 'Also: 1 vulnerable plugin or theme version.' ) ).toBeInTheDocument();
		expect( view.getByText( 'Showing the first 3 threats.' ) ).toBeInTheDocument();
		// Named by when the clean backup finished, which the restore screen asks the list for.
		await expect(
			view.findByRole( 'link', {
				name: `Restore ${ formatDateTime( new Date( 1792200135.5 * 1000 ) ) } backup instead`,
			} )
		).resolves.toBeInTheDocument();

		await user.click( view.getByRole( 'checkbox', { name: ACKNOWLEDGE } ) );
		expect( confirm ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it.each( [
		[ 'a flagged backup, ticked', FLAGGED, true ],
		[ 'a clean backup', CLEAN, false ],
	] )( 'sends acknowledge_threats only when ticked: %s', async ( _label, threats, ticked ) => {
		arrange( () => Promise.resolve( threats ) );
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: expect.stringContaining( `/rewind/backups/${ REWIND_ID }/threats` ),
				} )
			)
		);
		if ( ticked ) {
			await user.click( await view.findByRole( 'checkbox', { name: ACKNOWLEDGE } ) );
		}
		await user.click( await enabled( await view.findByRole( 'button', { name: CONFIRM } ) ) );

		await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
		expect( postedBodies()[ 0 ] ).toEqual( {
			types: expect.any( Object ),
			...( ticked ? { acknowledge_threats: true } : {} ),
		} );
	} );

	it.each( [
		[
			'threats_unavailable',
			() =>
				Promise.reject( {
					code: 'threats_unavailable',
					message: 'Known threats are not available for this site.',
					data: { status: 404 },
				} ),
		],
		[
			'a 500',
			() =>
				Promise.reject( {
					code: 'known_threats_fetch_failed',
					message: 'Could not fetch the known threats for this backup.',
					data: { status: 500 },
				} ),
		],
		[ 'a body without a summary', () => Promise.resolve( { threats: [] } ) ],
	] )( 'restores normally when threats are unavailable: %s', async ( _label, threats ) => {
		arrange( threats );
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( '/threats' ) } )
			)
		);
		expect( view.queryByText( /known to contain/ ) ).not.toBeInTheDocument();
		await user.click( await enabled( await view.findByRole( 'button', { name: CONFIRM } ) ) );
		expect( view.queryByRole( 'checkbox', { name: ACKNOWLEDGE } ) ).not.toBeInTheDocument();

		await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
		expect( postedBodies()[ 0 ] ).not.toHaveProperty( 'acknowledge_threats' );
		expect( view.queryByText( /Restore failed/ ) ).not.toBeInTheDocument();
		expect( view.queryByText( /threats/i ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'a clean backup', () => Promise.resolve( CLEAN ), true ],
		[
			'threats_unavailable',
			() => Promise.reject( { code: 'threats_unavailable', data: { status: 404 } } ),
			false,
		],
		[ 'a body without a summary', () => Promise.resolve( { threats: [] } ), false ],
	] )(
		'says no threats were found only when the check answered: %s',
		async ( _label, threats, said ) => {
			arrange( threats );
			const view = within( renderScreen() );

			await enabled( await view.findByRole( 'button', { name: CONFIRM } ) );
			await act( () => new Promise( resolve => setTimeout( resolve, ANNOUNCE_WINDOW_MS + 50 ) ) );

			const spoken = mockSpeak.mock.calls.map( ( [ message ] ) => message ).join( ' ' );
			expect( spoken.includes( 'No known threats found in this backup.' ) ).toBe( said );
		}
	);

	it( 'never asks on a site that cannot check, and restores as before', async () => {
		window.JPBACKUP_DASHBOARD_STATE = { knownThreatsAvailable: false };
		arrange( () => Promise.resolve( FLAGGED ) );
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await user.click( await enabled( await view.findByRole( 'button', { name: CONFIRM } ) ) );

		await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
		expect( postedBodies()[ 0 ] ).not.toHaveProperty( 'acknowledge_threats' );
		expect( mockApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '/threats' ) } )
		);
	} );

	it.each( [
		[ 'this backup', REWIND_ID, true ],
		[ 'another backup', '1786600000.1', false ],
	] )(
		"starts ticked only from the details' acknowledgement of %s",
		async ( _label, acknowledgedId, ticked ) => {
			window.history.replaceState( { jpbKnownThreatsAcknowledged: acknowledgedId }, '' );
			arrange( () => Promise.resolve( FLAGGED ) );
			const view = within( renderScreen() );

			await expect(
				view.findByRole( 'checkbox', { name: ACKNOWLEDGE, checked: ticked } )
			).resolves.toBeInTheDocument();
			window.history.replaceState( null, '' );
		}
	);

	it( 'returns to the confirm step on threats_not_acknowledged', async () => {
		let refused = false;
		arrange(
			() => Promise.resolve( CLEAN ),
			() => {
				if ( refused ) {
					return Promise.resolve( { id: 912682, rewind_id: REWIND_ID } );
				}
				refused = true;
				return Promise.reject( {
					code: 'threats_not_acknowledged',
					message: REFUSAL,
					data: { status: 409, known_threats: { malware: 1 } },
				} );
			}
		);
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await user.click( await enabled( await view.findByRole( 'button', { name: CONFIRM } ) ) );

		await expect( view.findByText( REFUSAL ) ).resolves.toBeInTheDocument();
		expect( view.queryByText( /Restore failed/ ) ).not.toBeInTheDocument();
		const box = view.getByRole( 'checkbox', { name: ACKNOWLEDGE } );
		expect( box ).not.toBeChecked();
		expect( view.getByRole( 'button', { name: CONFIRM } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await user.click( box );
		await user.click( view.getByRole( 'button', { name: CONFIRM } ) );
		await waitFor( () => expect( postedBodies() ).toHaveLength( 2 ) );
		expect( postedBodies()[ 1 ].acknowledge_threats ).toBe( true );
	} );

	describe( 'when the check never answers', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'enables Confirm after the timeout and restores without the flag', async () => {
			arrange( () => new Promise( () => {} ) );
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			const view = within( renderScreen() );

			const confirm = await view.findByRole( 'button', { name: CONFIRM } );
			expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( confirm ).toHaveAccessibleDescription( CHECKING );

			await act( async () => {
				await jest.advanceTimersByTimeAsync( KNOWN_THREATS_TIMEOUT_MS );
			} );
			await user.click( await enabled( await view.findByRole( 'button', { name: CONFIRM } ) ) );

			await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
			expect( postedBodies()[ 0 ] ).not.toHaveProperty( 'acknowledge_threats' );
		} );
	} );
} );

describe( 'opening another backup from the Restore screen', () => {
	afterEach( () => {
		mockRewindId = REWIND_ID;
	} );

	it( 'moves focus to the heading and drops the old acknowledgement', async () => {
		mockApiFetch.mockImplementation( ( options: Options ) => {
			const path = options?.path ?? '';
			if ( path.includes( '/site/capabilities' ) ) {
				return Promise.resolve( { hasBackupPlan: true, hasScan: true } );
			}
			if ( path.includes( '/threats' ) ) {
				return Promise.resolve( path.includes( REWIND_ID ) ? FLAGGED : CLEAN );
			}
			return Promise.resolve( {} );
		} );
		const user = userEvent.setup();
		const { container, rerender } = render(
			<QueryClientProvider>
				<RestoreScreen />
			</QueryClientProvider>
		);
		const view = within( container );
		await user.click( await view.findByRole( 'checkbox', { name: ACKNOWLEDGE } ) );

		mockRewindId = '1786600000.1';
		rerender(
			<QueryClientProvider>
				<RestoreScreen />
			</QueryClientProvider>
		);

		await waitFor( () =>
			expect( view.getByRole( 'heading', { name: 'Restore backup' } ) ).toHaveFocus()
		);
		await waitFor( () => expect( view.queryByText( WARNING ) ).not.toBeInTheDocument() );
	} );
} );
