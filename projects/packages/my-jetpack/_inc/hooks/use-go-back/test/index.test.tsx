import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { MyJetpackTabPanel } from '../../../components/my-jetpack-tab-panel';
import { MyJetpackRoutes } from '../../../constants';
import ValueStoreContextProvider from '../../../context/value-store/valueStoreContext';
import { useGoBack } from '../index';

// jsdom has no Navigation API, so mirror its history entries for `window.navigation`.
// Installed before any router, so its popstate listener runs first.
let entries = [ { key: '0', index: 0 } ];
let currentEntry = 0;
let pendingDelta: number | null = null;
const historyApi = window.history;
const { pushState, go } = historyApi;
const pushEntry = () => {
	entries = entries.slice( 0, currentEntry + 1 );
	currentEntry = entries.length;
	entries.push( { key: `${ Math.random() }`, index: currentEntry } );
};
historyApi.pushState = ( ...args ) => {
	pushEntry();
	pushState.apply( historyApi, args );
};
historyApi.go = ( delta = 0 ) => {
	pendingDelta = delta;
	go.call( historyApi, delta );
};
historyApi.back = () => historyApi.go( -1 );
historyApi.forward = () => historyApi.go( 1 );
window.addEventListener( 'popstate', () => {
	if ( pendingDelta === null ) {
		pushEntry();
	} else {
		currentEntry += pendingDelta;
		pendingDelta = null;
	}
} );
const fakeNavigation = {
	get currentEntry() {
		return entries[ currentEntry ];
	},
	entries: () => entries,
};
Object.defineProperty( window, 'navigation', { value: fakeNavigation, configurable: true } );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: () => true,
	isSimpleSite: () => false,
} ) );

jest.mock( '../../use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );

jest.mock( '../../use-is-jetpack-user-new', () => ( {
	__esModule: true,
	default: () => false,
} ) );

// "Upgrade" is a router navigation; "Upgrade (hash link)" mimics a plain `#/add-…` href,
// whose location keeps the 'default' key. "Details" stands in for the Protect details page.
const UpgradeLinks = () => (
	<>
		<Link to="/add-videopress">Upgrade</Link>
		<a href="#/add-videopress">Upgrade (hash link)</a>
		<Link to="/details">Details</Link>
		<Link to="/features">Features</Link>
	</>
);

jest.mock( '../../../components/my-jetpack-tab-panel/tab-content', () => ( {
	TabContent: () => mockUpgradeLinks(),
} ) );
const mockUpgradeLinks = UpgradeLinks;

const UpgradeScreen = () => {
	const { onClickGoBack, backTo } = useGoBack( {
		slug: 'videopress',
		fallback: MyJetpackRoutes.Features,
	} );
	return (
		<>
			<Link onClick={ onClickGoBack } to={ backTo }>
				My Jetpack
			</Link>
			<Link to="/details">Details</Link>
			<Link to="/overview">Overview</Link>
		</>
	);
};

const Location = () => {
	const { pathname, search } = useLocation();
	return <p data-testid="location">{ pathname + search }</p>;
};

const renderApp = ( initialEntry: string ) => {
	if ( window.location.hash !== `#${ initialEntry }` ) {
		window.history.pushState( null, '', `#${ initialEntry }` );
	}
	return render(
		<ValueStoreContextProvider>
			<HashRouter>
				<Routes>
					<Route path="/add-videopress" element={ <UpgradeScreen /> } />
					<Route path="/add-old-slug" element={ <Navigate replace to="/add-videopress" /> } />
					{ /* Stands in for a page outside My Jetpack, such as Boost's dashboard. */ }
					<Route path="/outside" element={ <UpgradeLinks /> } />
					<Route path="/details" element={ <UpgradeLinks /> } />
					<Route path={ MyJetpackRoutes.Home } element={ <MyJetpackTabPanel /> } />
				</Routes>
				<Location />
			</HashRouter>
		</ValueStoreContextProvider>
	);
};

const openUpgradeScreen = async ( start: string, links: string[], referrer: string ) => {
	Object.defineProperty( document, 'referrer', { value: referrer, configurable: true } );
	const user = userEvent.setup();
	const { unmount } = renderApp( start );
	for ( const link of links ) {
		await user.click( await screen.findByRole( 'link', { name: link } ) );
	}
	return { user, unmount, backLink: await screen.findByRole( 'link', { name: 'My Jetpack' } ) };
};

const allowedReferrer = 'http://localhost/wp-admin/';
const foreignReferrer = 'https://example.com/';

describe( 'useGoBack', () => {
	// Going back pops the upgrade screen (no added entry); falling back to Features pushes one.
	it.each( [
		[
			'a tab, by hash link',
			'/features?view=list',
			[ 'Upgrade (hash link)' ],
			'',
			'/features?view=list',
			0,
		],
		[ 'a tab, inside the app', '/overview', [ 'Upgrade' ], '', '/overview', 0 ],
		[ 'a tab, through a details page', '/features', [ 'Details', 'Upgrade' ], '', '/features', 0 ],
		[ 'a redirected route, loaded directly', '/add-old-slug', [], '', '/features', 1 ],
		[
			'outside, allowed referrer',
			'/outside',
			[ 'Upgrade (hash link)' ],
			allowedReferrer,
			'/outside',
			0,
		],
		[
			'outside, foreign referrer',
			'/outside',
			[ 'Upgrade (hash link)' ],
			foreignReferrer,
			'/features',
			1,
		],
	] )(
		'goes back correctly from %s',
		async ( _from, start, links, referrer, expected, addedHistoryEntries ) => {
			const { user, backLink } = await openUpgradeScreen( start, links, referrer );
			const historyLength = window.history.length;

			await user.click( backLink );

			await waitFor( () =>
				expect( screen.getByTestId( 'location' ) ).toHaveTextContent( expected )
			);
			expect( window.history ).toHaveLength( historyLength + addedHistoryEntries );
		}
	);

	it( 'goes to the fallback when the tab is ahead in history', async () => {
		window.history.pushState( null, '', '#/outside' );
		const { user } = await openUpgradeScreen( '/add-videopress', [], '' );
		await user.click( screen.getByRole( 'link', { name: 'Overview' } ) );
		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/overview' )
		);

		window.history.back();
		const backLink = await screen.findByRole( 'link', { name: 'My Jetpack' } );
		const historyLength = window.history.length;
		await user.click( backLink );

		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/features' )
		);
		expect( window.history ).toHaveLength( historyLength );
	} );

	it( 'goes to the fallback when a new entry has replaced the tab', async () => {
		window.history.pushState( null, '', '#/outside' );
		const { user, backLink } = await openUpgradeScreen( '/add-videopress', [], '' );
		await user.click( backLink );
		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/features' )
		);

		window.history.back();
		await user.click( await screen.findByRole( 'link', { name: 'Details' } ) );
		await user.click( await screen.findByRole( 'link', { name: 'Upgrade' } ) );
		await user.click( await screen.findByRole( 'link', { name: 'My Jetpack' } ) );

		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/features' )
		);
	} );

	it( 'goes back to the tab shown after a reload', async () => {
		const { user, unmount } = await openUpgradeScreen( '/overview', [ 'Features', 'Upgrade' ], '' );
		window.history.back();
		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toBeInTheDocument();

		// A reload remounts the app, and WordPress core's canonical-URL script clears the state.
		unmount();
		window.history.replaceState( null, '' );
		renderApp( '/features' );
		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toBeInTheDocument();
		window.history.forward();
		const historyLength = window.history.length;
		await user.click( await screen.findByRole( 'link', { name: 'My Jetpack' } ) );

		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/features' )
		);
		expect( window.history ).toHaveLength( historyLength );
	} );

	it( 'falls back to Features without the Navigation API', async () => {
		Object.defineProperty( window, 'navigation', { value: undefined, configurable: true } );
		try {
			const { user, backLink } = await openUpgradeScreen( '/overview', [ 'Upgrade' ], '' );
			await user.click( backLink );
			await waitFor( () =>
				expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/features' )
			);
		} finally {
			Object.defineProperty( window, 'navigation', { value: fakeNavigation, configurable: true } );
		}
	} );
} );
