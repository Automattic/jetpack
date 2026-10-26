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

const renderApp = ( initialEntry: string ) =>
	render(
		<ValueStoreContextProvider>
			<MemoryRouter initialEntries={ [ initialEntry ] }>
				<Routes>
					<Route path="/add-videopress" element={ <UpgradeScreen /> } />
					<Route path={ MyJetpackRoutes.Home } element={ <MyJetpackTabPanel /> } />
				</Routes>
			</MemoryRouter>
		</ValueStoreContextProvider>
	);

describe( 'useGoBack', () => {
	it.each( [ 'overview', 'features' ] )(
		'returns to the %s tab that opened the upgrade screen',
		async tab => {
			const user = userEvent.setup();
			renderApp( `/${ tab }` );

			await user.click( await screen.findByRole( 'link', { name: 'Upgrade' } ) );
			await user.click( screen.getByRole( 'link', { name: 'My Jetpack' } ) );

			await expect( screen.findByTestId( 'tab' ) ).resolves.toHaveTextContent( tab );
		}
	);

	it( 'falls back to Features when the upgrade screen was opened directly', async () => {
		const user = userEvent.setup();
		renderApp( '/add-videopress' );

		await user.click( screen.getByRole( 'link', { name: 'My Jetpack' } ) );

		await expect( screen.findByTestId( 'tab' ) ).resolves.toHaveTextContent( 'features' );
	} );
} );
