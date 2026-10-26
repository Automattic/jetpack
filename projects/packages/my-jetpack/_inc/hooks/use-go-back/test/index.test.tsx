import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
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

jest.mock( '../../../components/my-jetpack-tab-panel/tab-content', () => ( {
	TabContent: ( { name }: { name: string } ) => {
		const { createElement } = jest.requireActual( 'react' );
		const { Link: RouterLink } = jest.requireActual( 'react-router' );
		return createElement(
			'div',
			null,
			createElement( 'p', { 'data-testid': 'tab' }, name ),
			createElement( RouterLink, { to: '/add-videopress' }, 'Upgrade' )
		);
	},
} ) );

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

// Stands in for a page outside My Jetpack, such as Boost's dashboard.
const OutsidePage = () => (
	<div>
		<p data-testid="tab">outside</p>
		<Link to="/add-videopress">Upgrade</Link>
	</div>
);

const renderApp = ( initialEntry: string ) =>
	render(
		<ValueStoreContextProvider>
			<MemoryRouter initialEntries={ [ initialEntry ] }>
				<Routes>
					<Route path="/add-videopress" element={ <UpgradeScreen /> } />
					<Route path="/outside" element={ <OutsidePage /> } />
					<Route path={ MyJetpackRoutes.Home } element={ <MyJetpackTabPanel /> } />
				</Routes>
			</MemoryRouter>
		</ValueStoreContextProvider>
	);

const allowedReferrer = 'http://localhost/wp-admin/';

beforeEach( () => {
	Object.defineProperty( window.history, 'length', { value: 2, configurable: true } );
} );

describe( 'useGoBack', () => {
	it.each( [
		[ 'the Overview tab', '/overview', allowedReferrer, 'overview' ],
		[ 'the Features tab', '/features', allowedReferrer, 'features' ],
		[ 'outside My Jetpack with an allowed referrer', '/outside', allowedReferrer, 'outside' ],
		[ 'outside My Jetpack with no referrer', '/outside', '', 'features' ],
		[
			'outside My Jetpack with a foreign referrer',
			'/outside',
			'https://example.com/',
			'features',
		],
	] )( 'goes back correctly when opened from %s', async ( _from, start, referrer, expected ) => {
		Object.defineProperty( document, 'referrer', { value: referrer, configurable: true } );
		const user = userEvent.setup();
		renderApp( start );

		await user.click( await screen.findByRole( 'link', { name: 'Upgrade' } ) );
		await user.click( screen.getByRole( 'link', { name: 'My Jetpack' } ) );

		await expect( screen.findByTestId( 'tab' ) ).resolves.toHaveTextContent( expected );
	} );
} );
