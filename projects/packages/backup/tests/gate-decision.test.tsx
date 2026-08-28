// JETPACK-2313 F1 — the gate decision was written twice.
//
// `<Gates>` walked connection → secondary admin → capabilities loading →
// capabilities error → plan, and `<BackupNowButton>` re-derived the same
// walk from the same two hooks to decide whether to render at all. It has
// to decide for itself: `DashboardLayout` passes header actions to
// `<Page>`, which renders them *above* `<Gates>` rather than inside it, so
// the button cannot rely on the gate having run.
//
// The two agreed — both withhold in every state short of "ready", so no
// contradictory UI was ever possible — which is what makes consolidating
// them a pure refactor and this file its safety net. It renders the real
// arrangement, button above gate in one tree, and pins what *both* show in
// each of the six states. Written against the duplicated code and passing
// there before `useGateState` existed; anything it catches afterwards is a
// behaviour change, not a cleanup.

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
const SECONDARY_ADMIN_SCREEN = 'Link your account to view backups';
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
 * The other three are answered plainly and identically in every state:
 * whatever withholds the button here has to be the gate decision, not a
 * fixture that never resolved.
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
		// The promoted-product catalogue, read by the no-plan screen.
		// `null` is the "no offer to show" answer, which that screen
		// renders without a price rather than failing.
		return Promise.resolve( null );
	} );
}

/**
 * Render the button and the gate in one tree, arranged as
 * `DashboardLayout` arranges them: the header action outside the gate,
 * the dashboard body inside it.
 *
 * A fresh `QueryClient` per render rather than the module singleton, so
 * one state's capabilities answer cannot be served from cache to the
 * next — the capabilities query is held for five minutes.
 *
 * Returns the container for the caller to wrap in `within()` itself,
 * which is what lets `testing-library/prefer-screen-queries` see the
 * scoping it allows. Scoped rather than `screen` because `Notice` and
 * `Button` announce through `@wordpress/a11y`'s speak region — a node
 * appended to `document.body` once per process that keeps its text
 * between tests.
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
 * The distinction is the point of this half of the file. "No button" is
 * also true of a button that has not decided yet, so an absence
 * assertion means nothing until the answer it decides on has landed —
 * and settling on the *gate's* output instead would quietly turn a test
 * of the button into a second test of the gate.
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

		// Nothing to await: the connection state is read synchronously
		// from a global and every query it gates is disabled, so no
		// request exists that could change this later.
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

		// The other two queries are answered, so their settling is what
		// separates "still starting up" from "held by capabilities".
		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: '/jetpack/v4/backups' } )
			)
		);

		expect( skeleton() ).not.toBeNull();
		expect( view.queryByText( BODY ) ).not.toBeInTheDocument();
		expect( view.queryByText( CAPABILITIES_ERROR ) ).not.toBeInTheDocument();
		expect( view.queryByText( NO_PLAN ) ).not.toBeInTheDocument();
		expect( headerSlot() ).toBeEmptyDOMElement();

		// Releasing the read is what proves the withholding above was the
		// loading state and not a fixture that never arrived: both the
		// body and the button turn up the moment it lands.
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

		// "We couldn't ask" must not be reported as "you don't have a
		// plan": a failed read leaves `data` undefined too.
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
		// A failed read leaves `data` undefined, exactly as no plan does.
		// Both must withhold the button, and for the same reason: nothing
		// here can say the site is entitled to press it.
		answerWith( () => Promise.reject( new Error( 'capabilities unavailable' ) ) );

		const { client, container } = renderButtonAlone();
		await capabilitiesSettled( client, 'error' );

		expect( container ).toBeEmptyDOMElement();
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
