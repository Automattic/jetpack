import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router';
import { MyJetpackTabPanel } from '../../../components/my-jetpack-tab-panel';
import { MyJetpackRoutes } from '../../../constants';
import ValueStoreContextProvider from '../../../context/value-store/valueStoreContext';
import { useGoBack } from '../index';

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
// whose location keeps the 'default' key.
const UpgradeLinks = () => (
	<>
		<Link to="/add-videopress">Upgrade</Link>
		<a href="#/add-videopress">Upgrade (hash link)</a>
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
		<Link onClick={ onClickGoBack } to={ backTo }>
			My Jetpack
		</Link>
	);
};

const Location = () => {
	const { pathname, search } = useLocation();
	return <p data-testid="location">{ pathname + search }</p>;
};

const renderApp = ( initialEntry: string ) => {
	window.location.hash = `#${ initialEntry }`;
	return render(
		<ValueStoreContextProvider>
			<HashRouter>
				<Routes>
					<Route path="/add-videopress" element={ <UpgradeScreen /> } />
					{ /* Stands in for a page outside My Jetpack, such as Boost's dashboard. */ }
					<Route path="/outside" element={ <UpgradeLinks /> } />
					<Route path={ MyJetpackRoutes.Home } element={ <MyJetpackTabPanel /> } />
				</Routes>
				<Location />
			</HashRouter>
		</ValueStoreContextProvider>
	);
};

const allowedReferrer = 'http://localhost/wp-admin/';

const openUpgradeScreen = async ( start: string, upgradeLink: string, referrer: string ) => {
	Object.defineProperty( document, 'referrer', { value: referrer, configurable: true } );
	const user = userEvent.setup();
	renderApp( start );
	await user.click( await screen.findByRole( 'link', { name: upgradeLink } ) );
	return { user, backLink: await screen.findByRole( 'link', { name: 'My Jetpack' } ) };
};

describe( 'useGoBack', () => {
	it.each( [
		[ 'a tab, inside the app', '/features?view=list', 'Upgrade', '', '/features?view=list' ],
		[
			'a tab, by hash link',
			'/features?view=list',
			'Upgrade (hash link)',
			'',
			'/features?view=list',
		],
		[ 'outside, allowed referrer', '/outside', 'Upgrade (hash link)', allowedReferrer, '/outside' ],
		[ 'outside, no referrer', '/outside', 'Upgrade (hash link)', '', '/features' ],
		[
			'outside, foreign referrer',
			'/outside',
			'Upgrade (hash link)',
			'https://example.com/',
			'/features',
		],
	] )( 'goes back correctly from %s', async ( _from, start, upgradeLink, referrer, expected ) => {
		const { user, backLink } = await openUpgradeScreen( start, upgradeLink, referrer );

		await user.click( backLink );

		await waitFor( () => expect( screen.getByTestId( 'location' ) ).toHaveTextContent( expected ) );
	} );

	it( 'pops the upgrade screen off history when going back inside the app', async () => {
		const { user, backLink } = await openUpgradeScreen( '/overview', 'Upgrade', '' );
		const historyLength = window.history.length;

		await user.click( backLink );

		await waitFor( () =>
			expect( screen.getByTestId( 'location' ) ).toHaveTextContent( '/overview' )
		);
		expect( window.history ).toHaveLength( historyLength );
	} );
} );
