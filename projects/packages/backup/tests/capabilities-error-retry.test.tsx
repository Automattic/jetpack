// JETPACK-2243 D6 — the fourth surface of the retry-rewind class, and
// the widest.
//
// #51401 fixed the activity list, the file browser and the backup-status
// card by holding the last error at the hook layer. `useCapabilities` was
// not among them, and it is the one that matters most: `<Gates>` wraps
// the entire dashboard body on all three routes, so clicking its "Try
// again" replaced the whole page with an unlabelled spinner — the reason,
// the explanation and the only control that can ask again, all gone —
// then brought them back if the retry failed too.

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
import { render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Gates from '../src/dashboard/components/gates';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const UPSTREAM_REASON = "Could not read this site's plan details.";
// Matched as a pattern, not an exact string: `Notice` renders a
// visually-hidden "Error notice" label inside the same content element,
// so no single node's text equals the message on its own.
const REASON_SHOWN = /Could not read this site's plan details/;

/**
 * A promise whose settlement the test controls, so a retry can be held
 * in flight while assertions run against the rendered output.
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
 * Answer the capabilities route from a queue of outcomes.
 *
 * A counter rather than `mockRejectedValueOnce`: React Query may invoke
 * a query function more than once per logical fetch, and a `…Once` mock
 * silently resolves `undefined` on the extra call — which reads as a
 * successful capabilities read and renders the dashboard body.
 *
 * @param outcomes - One entry per logical fetch; later fetches reuse the last.
 */
function answerWith( outcomes: Array< () => Promise< unknown > > ) {
	let call = 0;
	mockApiFetch.mockImplementation( () => {
		const outcome = outcomes[ Math.min( call, outcomes.length - 1 ) ];
		call += 1;
		return outcome();
	} );
}

/**
 * The bridge's own refusal of a 200 it could not read.
 *
 * @return A rejected promise in the shape `apiCall` re-throws.
 */
const unreadable = () =>
	Promise.reject( {
		code: 'capabilities_unreadable',
		message: UPSTREAM_REASON,
		data: { status: 500 },
	} );

/**
 * Render the gate with a body that must never appear in these tests.
 *
 * Scoped queries rather than `screen`: the error card is a `Notice`,
 * which announces itself through `@wordpress/a11y`'s speak region — a
 * node appended to `document.body` once per process that keeps its text
 * between tests.
 *
 * Callers wrap the result in `within()` themselves so that
 * `testing-library/prefer-screen-queries` can see the scoping it allows.
 *
 * @return The rendered container.
 */
function renderGate(): HTMLElement {
	const { container } = render(
		<QueryClientProvider>
			<Gates>
				<div>dashboard body</div>
			</Gates>
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

describe( 'Gates — retrying a failed capabilities read', () => {
	it( 'keeps the reason on screen while the retry is in flight', async () => {
		const user = userEvent.setup();
		// Hold the retry in flight so the mid-retry render is observable.
		const pending = deferred< unknown >();
		answerWith( [ unreadable, () => pending.promise ] );

		const view = within( renderGate() );
		await expect( view.findByText( REASON_SHOWN ) ).resolves.toBeInTheDocument();

		await user.click( view.getByRole( 'button', { name: /Try again/ } ) );

		// The whole point: the page did not blank.
		expect( view.getByText( REASON_SHOWN ) ).toBeInTheDocument();
		expect( view.queryByText( 'dashboard body' ) ).not.toBeInTheDocument();

		pending.resolve( { hasBackupPlan: true, hasScan: false } );
		await expect( view.findByText( 'dashboard body' ) ).resolves.toBeInTheDocument();
	} );

	it( 'reports the retry as busy rather than leaving the button idle', async () => {
		// Without this the DOM is byte-identical before and after the
		// click, so a retry that fails again looks like a dead button.
		const user = userEvent.setup();
		const pending = deferred< unknown >();
		answerWith( [ unreadable, () => pending.promise ] );

		const view = within( renderGate() );
		await expect( view.findByText( REASON_SHOWN ) ).resolves.toBeInTheDocument();

		const button = view.getByRole( 'button', { name: /Try again/ } );
		await user.click( button );

		// `aria-disabled`, not `toBeDisabled()`: the button stays natively
		// enabled on purpose so it keeps keyboard focus. Losing focus to
		// `<body>` would reproduce "the page went away" for AT users, in
		// the one place there is nothing adjacent to land on.
		await waitFor( () =>
			expect( view.getByRole( 'button', { name: /Try again/ } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			)
		);
		expect( view.getByRole( 'button', { name: /Try again/ } ) ).toBeEnabled();

		pending.resolve( { hasBackupPlan: true, hasScan: false } );
	} );

	it( 'still shows a plain spinner on the very first load', async () => {
		// The loading branch is first-load-only now, so it must still fire
		// when there is genuinely nothing to show yet.
		const pending = deferred< unknown >();
		answerWith( [ () => pending.promise ] );

		const view = within( renderGate() );

		expect( view.queryByText( REASON_SHOWN ) ).not.toBeInTheDocument();
		expect( view.queryByText( 'dashboard body' ) ).not.toBeInTheDocument();

		pending.resolve( { hasBackupPlan: true, hasScan: false } );
		await expect( view.findByText( 'dashboard body' ) ).resolves.toBeInTheDocument();
	} );
} );
