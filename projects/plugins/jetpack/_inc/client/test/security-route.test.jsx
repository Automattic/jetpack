import { render, screen } from '@testing-library/react';
import { Main } from '../main';
import { openProtectSettings } from '../security/protect-page';

jest.mock( '../security/protect-page', () => ( {
	...jest.requireActual( '../security/protect-page' ),
	openProtectSettings: jest.fn(),
} ) );

jest.mock( 'components/settings-admin-page', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

jest.mock( 'settings/index.jsx', () => ( {
	__esModule: true,
	default: () => <div data-testid="searchable-settings" />,
} ) );

jest.mock( 'components/admin-notices', () => ( { __esModule: true, default: () => null } ) );
jest.mock( 'components/jetpack-notices', () => ( { __esModule: true, default: () => null } ) );
jest.mock( 'components/settings-nav-tabs', () => ( { __esModule: true, default: () => null } ) );
jest.mock( 'components/tracker', () => ( { __esModule: true, default: () => null } ) );

const renderAt = ( pathname, hasProtectPage ) =>
	render(
		<Main
			location={ { pathname, search: '' } }
			navigate={ jest.fn() }
			setInitialState={ jest.fn() }
			setConnectionStatus={ jest.fn() }
			clearUnsavedSettingsFlag={ jest.fn() }
			siteConnectionStatus
			userCanManageModules
			hasProtectPage={ hasProtectPage }
			siteAdminUrl="https://example.com/wp-admin/"
		/>
	);

describe( 'Main #/security route', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'sends #/security to the Protect page when it is on', () => {
		renderAt( '/security', true );

		expect( openProtectSettings ).toHaveBeenCalledWith( 'https://example.com/wp-admin/' );
		expect( screen.queryByTestId( 'searchable-settings' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the Security tab when the Protect page is off', () => {
		renderAt( '/security', false );

		expect( openProtectSettings ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
	} );
} );
