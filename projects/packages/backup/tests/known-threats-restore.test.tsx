const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: REWIND_ID } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
			reported_on: '2026-08-01T12:00:00+00:00',
			fixed_on: null,
		},
		{
			id: 12,
			state: 'fixed',
			kind: 'database',
			signature: 'Database.Injection',
			path_kind: 'database',
			type: 'database',
			target: 'wp_options',
			status: 'fixed',
			reported_on: '2026-08-02T12:00:00+00:00',
			fixed_on: '2026-08-05T12:00:00+00:00',
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

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'known threats on the Restore screen', () => {
	it( 'shows the warning and requires the checkbox for a flagged backup', async () => {
		arrange( () => Promise.resolve( FLAGGED ) );
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await expect( view.findByText( WARNING ) ).resolves.toBeInTheDocument();
		const confirm = view.getByRole( 'button', { name: CONFIRM } );
		expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( confirm ).toHaveAccessibleDescription( /known threats/ );

		await user.click( view.getByRole( 'button', { name: 'Show threats' } ) );
		const rows = within( view.getByRole( 'table' ) ).getAllByRole( 'row' );
		expect( rows.map( row => row.textContent ) ).toEqual( [
			expect.stringMatching( /Threat.*Where.*First detected.*Status now/ ),
			expect.stringMatching( /PHP\.Backdoor\.Generic.*wp-content\/uploads\/x\.php.*Open/ ),
			expect.stringMatching( /Database\.Injection.*wp_options.*Fixed/ ),
		] );
		expect( view.getByText( 'Also: 1 vulnerable plugin or theme version.' ) ).toBeInTheDocument();

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
		await user.click( await view.findByRole( 'button', { name: CONFIRM } ) );

		await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
		expect( 'acknowledge_threats' in postedBodies()[ 0 ] ).toBe( ticked );
		expect( postedBodies()[ 0 ].acknowledge_threats ).toBe( ticked || undefined );
	} );

	it( 'restores normally when threats are unavailable', async () => {
		arrange( () =>
			Promise.reject( {
				code: 'threats_unavailable',
				message: 'Known threats are not available for this site.',
				data: { status: 404 },
			} )
		);
		const user = userEvent.setup();
		const view = within( renderScreen() );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringContaining( '/threats' ) } )
			)
		);
		expect( view.queryByText( /known to contain/ ) ).not.toBeInTheDocument();
		expect( view.queryByRole( 'checkbox', { name: ACKNOWLEDGE } ) ).not.toBeInTheDocument();
		await user.click( await view.findByRole( 'button', { name: CONFIRM } ) );

		await waitFor( () => expect( postedBodies() ).toHaveLength( 1 ) );
		expect( postedBodies()[ 0 ] ).not.toHaveProperty( 'acknowledge_threats' );
		expect( view.queryByText( /Restore failed/ ) ).not.toBeInTheDocument();
		expect( view.queryByText( /threats/i ) ).not.toBeInTheDocument();
	} );

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

		await user.click( await view.findByRole( 'button', { name: CONFIRM } ) );

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
} );
