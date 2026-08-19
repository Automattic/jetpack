// Regression tests for JETPACK-2243 F2.
//
// `useActivityPageQuery` sets `placeholderData: keepPreviousData`, which
// is what makes pagination feel smooth: the previous page stays on
// screen while the next one is fetched. React Query expresses that as
// `isLoading === false` — the query is not *pending*, it is holding
// placeholder rows — so the list was handing DataViews `isLoading` and
// telling it "not loading" over rows that belong to the page the reader
// just left. Clicking to page 2 changed nothing on screen until the
// response landed.
//
// The fix reports `isLoading || isFetching`. That it cannot swallow the
// error state is not obvious and is worth stating: DataViews 17.3.0
// initialises `hasInitiallyLoaded` to `!isLoading` and latches it true
// on the first non-loading render, and the spinner branch that would
// replace the `empty` slot — where `QueryError` lives — is gated on
// `!hasInitiallyLoaded`. After the first load that branch is dead, so a
// truthy `isLoading` only reaches the footer. What the error slot does
// across a retry is held by `error-persists-during-retry.test.tsx`.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import ActivityList from '../src/dashboard/components/activity-list';
import { queryClient } from '../src/dashboard/data/query-client';
import { ACTIVITY_LOG_DEFAULT_PER_PAGE } from '../src/dashboard/hooks/use-activity-log';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { View } from '@wordpress/dataviews';

const noop = () => {};

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: ACTIVITY_LOG_DEFAULT_PER_PAGE,
	filters: [],
	titleField: 'title',
	mediaField: 'icon',
	descriptionField: 'description',
	fields: [],
};

/**
 * One raw rewindable-activity row for the page under test.
 *
 * @param page - Page number, woven into the ids so each page is distinguishable on screen.
 * @return A raw activity entry.
 */
function activityEntry( page: number ) {
	return {
		activity_id: `act-page-${ page }`,
		gridicon: 'cloud',
		summary: `Backup complete (page ${ page })`,
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: `178664453${ page }.123`,
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '46 plugins, 23 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/**
 * A promise whose settlement the test controls, so a request can be held
 * in flight while assertions run against the rendered output.
 *
 * @return The promise and its resolver.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason?: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

/**
 * Harness giving `ActivityList` the controlled view state it expects,
 * plus a button the test uses to advance the page the way DataViews'
 * footer would.
 *
 * @return The rendered harness.
 */
function Harness() {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	const goToPageTwo = useCallback( () => setView( v => ( { ...v, page: 2 } ) ), [] );
	return (
		<QueryClientProvider>
			<button onClick={ goToPageTwo }>Go to page 2</button>
			<ActivityList selectedId={ null } onSelect={ noop } view={ view } onChangeView={ setView } />
		</QueryClientProvider>
	);
}

/**
 * The element carrying the list's busy state.
 *
 * @return The activity list container.
 */
function list() {
	return document.querySelector( '.jpb-activity-list' ) as HTMLElement;
}

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

it( 'reports the list as busy while the next page is still in flight', async () => {
	const secondPage = deferred< unknown >();
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( 'page=2' ) ) {
			return secondPage.promise;
		}
		return Promise.resolve( {
			current: { orderedItems: [ activityEntry( 1 ) ] },
			totalItems: 20,
			totalPages: 2,
		} );
	} );

	render( <Harness /> );

	await expect( screen.findByText( 'Backup complete (page 1)' ) ).resolves.toBeInTheDocument();
	expect( list() ).toHaveAttribute( 'aria-busy', 'false' );

	await userEvent.click( screen.getByRole( 'button', { name: 'Go to page 2' } ) );

	// The page-1 rows are still on screen — that is the whole point of
	// `keepPreviousData` — so the busy flag is the only thing that can
	// tell the reader their click was received.
	await waitFor( () => expect( list() ).toHaveAttribute( 'aria-busy', 'true' ) );
	expect( screen.getByText( 'Backup complete (page 1)' ) ).toBeInTheDocument();

	secondPage.resolve( {
		current: { orderedItems: [ activityEntry( 2 ) ] },
		totalItems: 20,
		totalPages: 2,
	} );

	await expect( screen.findByText( 'Backup complete (page 2)' ) ).resolves.toBeInTheDocument();
	expect( list() ).toHaveAttribute( 'aria-busy', 'false' );
} );
