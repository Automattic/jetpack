// Regression tests for JETPACK-2243 B5.
//
// `/restore/not-a-real-id` rendered a fully armed Confirm restore button.
// The only thing the bad id changed was that the "Restore point:" line
// was silently omitted — a detail nobody would read as a warning — and
// the button beside it would have sent the malformed id upstream.
//
// The screens already had the signal and were only half-using it:
// `rewindIdToIso()` returned null for an id it could not parse, and both
// screens used that solely to hide the date.
//
// The check is deliberately about the *shape* of the id, not whether the
// backup exists. `parseInt` accepts a numeric prefix, so `123abc` parsed
// to `123` and rendered "Jan 1, 1970" as a restore point above a live
// button — a plausible-looking screen rather than an obviously broken
// one, which is the worse of the two failures.

const mockApiFetch = jest.fn();
const mockParams = jest.fn< { rewindId: string }, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => mockParams(),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import DownloadScreen from '../src/dashboard/screens/download';
import RestoreScreen from '../src/dashboard/screens/restore';
import { isValidRewindId, rewindIdToIso } from '../src/dashboard/types/rewind-id';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const CAPABILITIES = { hasBackupPlan: true, hasScan: false };

// A real WPCOM rewind id: unix seconds with a decimal suffix.
const VALID_ID = '1786644531.123';

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	// Both screens render behind `<Gates>`, which resolves capabilities
	// before it mounts the body under test.
	mockApiFetch.mockResolvedValue( CAPABILITIES );
	mockParams.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'isValidRewindId', () => {
	it.each( [ '1786644531', '1786644531.123', '1786644531.9425' ] )(
		'accepts the WPCOM id %s',
		id => {
			expect( isValidRewindId( id ) ).toBe( true );
		}
	);

	it.each( [
		[ 'a word', 'not-a-real-id' ],
		[ 'a numeric prefix, which parseInt would have accepted', '123abc' ],
		[ 'the empty string', '' ],
		[ 'zero', '0' ],
		[ 'a negative number', '-1786644531' ],
		[ 'a trailing dot', '1786644531.' ],
		[ 'whitespace', ' 1786644531' ],
		// Digits are not enough. `Date` is only defined within ±8.64e15 ms,
		// so an id past that ceiling is well-formed and still throws in
		// `rewindIdToIso` — which put the route's error boundary on screen,
		// with a "Reload the page" button that reloads into the same throw,
		// in place of the card this gate exists to show.
		//
		// The gate stops there: it does not judge whether a representable
		// date is a *plausible* one. `8640000000000` is accepted and renders
		// "Sep 13, +275760", which is odd but harmless and unreachable
		// except by typing it. Rejecting it means picking an arbitrary
		// horizon, which risks turning away genuinely old backups.
		[ 'an unrepresentable date', '8640000000001' ],
	] )( 'rejects %s', ( _label, id ) => {
		expect( isValidRewindId( id ) ).toBe( false );
	} );
} );

describe( 'rewindIdToIso', () => {
	it( 'converts unix seconds to an ISO timestamp', () => {
		expect( rewindIdToIso( '1786644531.123' ) ).toBe( new Date( 1786644531000 ).toISOString() );
	} );
} );

describe.each( [
	{
		name: 'restore',
		Screen: RestoreScreen,
		heading: 'Restore backup',
		submit: 'Confirm restore',
		notFound: "This restore link isn't valid.",
	},
	{
		name: 'download',
		Screen: DownloadScreen,
		heading: 'Download backup',
		submit: 'Generate download',
		notFound: "This download link isn't valid.",
	},
] )( '$name screen', ( { Screen, heading, submit, notFound } ) => {
	it( 'refuses to arm the form for a malformed rewind id', async () => {
		mockParams.mockReturnValue( { rewindId: 'not-a-real-id' } );

		render(
			<QueryClientProvider>
				<Screen />
			</QueryClientProvider>
		);

		await expect( screen.findByText( notFound ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: new RegExp( submit ) } )
		).not.toBeInTheDocument();
		// The way back is the whole recovery affordance, so it has to
		// survive. Matched by text: the `Link` mock renders an anchor with
		// no `href`, which carries no implicit `link` role.
		expect( screen.getByText( 'Back to overview' ) ).toBeInTheDocument();
	} );

	it( 'refuses an id that only starts with digits', async () => {
		// This is the one that rendered a believable screen: `parseInt`
		// took `123`, so the card showed a January 1970 restore point
		// above a live button.
		mockParams.mockReturnValue( { rewindId: '123abc' } );

		render(
			<QueryClientProvider>
				<Screen />
			</QueryClientProvider>
		);

		await expect( screen.findByText( notFound ) ).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: new RegExp( submit ) } )
		).not.toBeInTheDocument();
	} );

	it( 'arms the form for a real rewind id', async () => {
		mockParams.mockReturnValue( { rewindId: VALID_ID } );

		render(
			<QueryClientProvider>
				<Screen />
			</QueryClientProvider>
		);

		await expect( screen.findByText( heading ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: new RegExp( submit ) } ) ).toBeInTheDocument();
		expect( screen.queryByText( notFound ) ).not.toBeInTheDocument();
	} );
} );
