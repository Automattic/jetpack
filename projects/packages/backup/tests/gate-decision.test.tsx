// JETPACK-2313 F1 — the gate decision was written twice: `<Gates>` walked it, and
// `<BackupNowButton>` re-derived the same walk because it renders above the gate.
//
// The two already agreed, so consolidating them is a pure refactor and this file is its
// safety net: button and gate in one tree, pinning what both show in each of the six
// states. Written against the duplicated code and passing there first.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor, within } from '@testing-library/react';
import BackupNowButton from '../src/dashboard/components/backup-now-button';
import Gates from '../src/dashboard/components/gates';
import { keys } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SECONDARY_ADMIN = { isRegistered: true, hasConnectedOwner: true, isUserConnected: false };
const DISCONNECTED = { isRegistered: false, hasConnectedOwner: false, isUserConnected: false };

const CAPABILITIES_PATH = '/jetpack/v4/site/capabilities';

// One marker per branch of the gate's decision tree, so a test that
// expects one screen cannot be satisfied by another.
const NOT_CONNECTED = 'Connect Jetpack to get started';
const SECONDARY_ADMIN_SCREEN = 'Link your WordPress.com account';
const NO_PLAN = "This site doesn't have an active Backup plan";
const CAPABILITIES_ERROR = "We couldn't load your backup details";
const BODY = 'dashboard body';

/**
 * A promise whose settlement the test controls, so the capabilities read
 * can be held in flight while assertions run against the rendered output.
 *
 * @return The promise and its resolver.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( res => {
		resolve = res;
	} );
	return { promise, resolve };
}

/**
 * Answer every endpoint this tree reads, with the capabilities route
 * under the caller's control.
 *
 * The other three answer plainly in every state, so whatever withholds the button has to
 * be the gate decision and not an unresolved fixture.
 *
 * @param capabilities - Produces the capabilities response; called per fetch.
 */
function answerWith( capabilities: () => Promise< unknown > ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return capabilities();
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path.includes( '/backups' ) ) {
			return Promise.resolve( [] );
		}
		// The promoted-product catalogue. `null` means "no offer", which the no-plan
		// screen renders without a price rather than failing.
		return Promise.resolve( null );
	} );
}

/**
 * Render the button and the gate in one tree, arranged as
 * `DashboardLayout` arranges them: the header action outside the gate,
 * the dashboard body inside it.
 *
 * A fresh `QueryClient` per render, so one state's capabilities answer is not served
 * from cache to the next. Scoped queries rather than `screen`, because `@wordpress/a11y`
 * keeps its speak region on `document.body` between tests.
 *
 * @return The render container.
 */
function renderShell(): HTMLElement {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const { container } = render(
		<QueryClientProvider client={ client }>
			<div className="jpb-test-header-actions">
				<BackupNowButton />
			</div>
			<Gates>
				<div>{ BODY }</div>
			</Gates>
		</QueryClientProvider>
	);
	return container;
}

/**
 * The header slot `renderShell` puts the button in, standing in for the
 * `actions` prop `DashboardLayout` hands to `<Page>`.
 *
 * @return The slot element.
 */
function headerSlot(): HTMLElement {
	return document.querySelector( '.jpb-test-header-actions' ) as HTMLElement;
}

/**
 * The gate's first-load spinner, if it is on screen.
 *
 * @return The skeleton element, or null.
 */
function skeleton(): HTMLElement | null {
	return document.querySelector( '.jpb-gates__skeleton' );
}

/**
 * Render the header button with no gate anywhere above it, and hand back
 * the client so a test can settle on the capabilities answer reaching
 * the cache rather than on anything that got rendered.
 *
 * "No button" is also true of a button that has not decided yet, so the absence
 * assertions mean nothing until the answer has landed.
 *
 * @return The client and the render container.
 */
function renderButtonAlone() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const { container } = render(
		<QueryClientProvider client={ client }>
			<BackupNowButton />
		</QueryClientProvider>
	);
	return { client, container };
}

/**
 * Wait until the capabilities query has settled.
 *
 * @param client - The client the tree is rendering against.
 * @param status - The settled status to wait for.
 */
async function capabilitiesSettled( client: QueryClient, status: 'success' | 'error' ) {
	await waitFor( () =>
		expect( client.getQueryState( keys.capabilities() )?.status ).toBe( status )
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();
	answerWith( () => Promise.resolve( { hasBackupPlan: true, hasScan: false } ) );
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'Gate decision — what the gate and the header button each show', () => {
	it( 'shows the connect screen and no button when the site is not connected', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: DISCONNECTED,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const view = within( renderShell() );

		// Nothing to await: the connection state is synchronous and every query it
		// gates is disabled, so no request could change this later.
		expect( view.getByText( NOT_CONNECTED ) ).toBeInTheDocument();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the link-account screen and no button for an unconnected secondary admin', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: SECONDARY_ADMIN,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const view = within( renderShell() );

		expect( view.getByText( SECONDARY_ADMIN_SCREEN ) ).toBeInTheDocument();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'spins, and withholds the button, while the first capabilities read is in flight', async () => {
		const pending = deferred< unknown >();
		answerWith( () => pending.promise );

		const view = within( renderShell() );

		// Nothing else in this tree fetches until capabilities answers, so its own
		// request is what separates "still starting up" from "held by capabilities".
		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: CAPABILITIES_PATH } )
			)
		);

		expect( skeleton() ).not.toBeNull();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( view.queryByText( CAPABILITIES_ERROR ) ).not.toBeInTheDocument();
		expect( view.queryByText( NO_PLAN ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();

		// Releasing the read proves the withholding above was the loading state and
		// not a fixture that never arrived.
		pending.resolve( { hasBackupPlan: true, hasScan: false } );
		await expect( view.findByText( BODY ) ).resolves.toBeInTheDocument();
		await expect(
			within( headerSlot() ).findByRole( 'button', { name: 'Back up now' } )
		).resolves.toBeInTheDocument();
		expect( skeleton() ).toBeNull();
	} );

	it( 'shows the error screen and no button when capabilities cannot be read', async () => {
		answerWith( () => Promise.reject( new Error( 'capabilities unavailable' ) ) );

		const view = within( renderShell() );

		await expect( view.findByText( CAPABILITIES_ERROR ) ).resolves.toBeInTheDocument();

		// "We couldn't ask" is not "you don't have a plan": a failed read also leaves
		// `data` undefined.
		expect( view.queryByText( NO_PLAN ) ).not.toBeInTheDocument();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();
	} );

	it( 'shows the upgrade screen and no button when the site has no plan', async () => {
		answerWith( () => Promise.resolve( { hasBackupPlan: false, hasScan: false } ) );

		const view = within( renderShell() );

		await expect( view.findByText( NO_PLAN ) ).resolves.toBeInTheDocument();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();
	} );

	it( 'shows the dashboard body and the button when everything passes', async () => {
		const view = within( renderShell() );

		await expect( view.findByText( BODY ) ).resolves.toBeInTheDocument();
		await expect(
			within( headerSlot() ).findByRole( 'button', { name: 'Back up now' } )
		).resolves.toBeInTheDocument();
		expect( view.queryByText( NO_PLAN ) ).not.toBeInTheDocument();
		expect( view.queryByText( CAPABILITIES_ERROR ) ).not.toBeInTheDocument();
	} );
} );

describe( 'The header button on its own, with no gate above it', () => {
	it( 'stays away on a site with no plan', async () => {
		answerWith( () => Promise.resolve( { hasBackupPlan: false, hasScan: false } ) );

		const { client, container } = renderButtonAlone();
		await capabilitiesSettled( client, 'success' );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'stays away when capabilities cannot be read', async () => {
		// A failed read leaves `data` undefined exactly as no plan does, and neither
		// can say the site is entitled to press this.
		answerWith( () => Promise.reject( new Error( 'capabilities unavailable' ) ) );

		const { client, container } = renderButtonAlone();
		await capabilitiesSettled( client, 'error' );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'stays away while the first capabilities read is in flight', async () => {
		const pending = deferred< unknown >();
		answerWith( () => pending.promise );

		const { client, container } = renderButtonAlone();

		// Capabilities is the button's only read until the verdict is `ready`, so a
		// query in flight is what says the render got that far.
		await waitFor( () =>
			expect( client.getQueryState( keys.capabilities() )?.fetchStatus ).toBe( 'fetching' )
		);
		expect( container ).toBeEmptyDOMElement();

		// And only that: releasing the read brings the button back, unchanged.
		pending.resolve( { hasBackupPlan: true, hasScan: false } );
		await waitFor( () => expect( container ).not.toBeEmptyDOMElement() );
		expect( container ).toHaveTextContent( 'Back up now' );
	} );

	it( 'stays away for an unconnected secondary admin', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: SECONDARY_ADMIN,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const { container } = renderButtonAlone();

		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'stays away on a site that is not connected at all', () => {
		window.JP_CONNECTION_INITIAL_STATE = {
			...window.JP_CONNECTION_INITIAL_STATE,
			connectionStatus: DISCONNECTED,
		} as typeof window.JP_CONNECTION_INITIAL_STATE;

		const { container } = renderButtonAlone();

		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );

describe( 'Shared capabilities read', () => {
	it( 'is issued once for the two of them', async () => {
		// Both read the same query key, so mounting the button above the
		// gate must not cost a second round trip to WPCOM.
		const view = within( renderShell() );
		await expect( view.findByText( BODY ) ).resolves.toBeInTheDocument();

		const capabilityReads = mockApiFetch.mock.calls.filter(
			( [ options ] ) => options?.path === CAPABILITIES_PATH
		);
		expect( capabilityReads ).toHaveLength( 1 );
	} );
} );
