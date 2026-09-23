import { render, screen } from '@testing-library/react';
import SettingsRoot from '../settings-root';

jest.mock( 'lib/accessible-focus', () => jest.fn() );

jest.mock( 'state/redux-store', () => {
	const state = { marker: 'from-store' };
	return {
		__esModule: true,
		default: { getState: () => state, subscribe: () => () => {}, dispatch: jest.fn() },
	};
} );

jest.mock( 'main', () => {
	const { useSelector } = jest.requireActual( 'react-redux' );
	const { useLocation } = jest.requireActual( 'react-router' );

	return {
		__esModule: true,
		default: function MockMain() {
			const marker = useSelector( state => state.marker );
			const { pathname } = useLocation();
			return <div data-testid="settings-main">{ `${ marker } ${ pathname }` }</div>;
		},
	};
} );

describe( 'SettingsRoot', () => {
	it( 'renders Main inside the store and the hash router', () => {
		window.location.hash = '#/security';

		render( <SettingsRoot /> );

		expect( screen.getByTestId( 'settings-main' ) ).toHaveTextContent( 'from-store /security' );
	} );
} );
