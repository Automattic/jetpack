import { getAdminUrl } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { isSettingsConsolidationEnabled } from 'lib/settings-consolidation';
import { Main } from '../main';
import { openProtectSettings } from '../security/protect-page';

jest.mock( '../security/protect-page', () => ( {
	...jest.requireActual( '../security/protect-page' ),
	openProtectSettings: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getAdminUrl: jest.fn( path => `https://example.com/wp-admin/${ path }` ),
} ) );

jest.mock( 'lib/settings-consolidation', () => ( {
	...jest.requireActual( 'lib/settings-consolidation' ),
	isSettingsConsolidationEnabled: jest.fn( () => false ),
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

const renderAt = ( pathname, hasProtectPage, extraProps = {} ) =>
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
			{ ...extraProps }
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

describe( 'Main routes that leave Settings once settings move out', () => {
	afterEach( () => {
		isSettingsConsolidationEnabled.mockReturnValue( false );
		jest.clearAllMocks();
	} );

	it.each( [
		[ '/performance', 'admin.php?page=my-jetpack#/features?search=cdn' ],
		[ '/sharing', 'admin.php?page=my-jetpack#/features?search=sharing' ],
		[ '/reader', 'admin.php?page=my-jetpack#/features?search=reader' ],
		[ '/writing', 'admin.php?page=my-jetpack#/features' ],
		[ '/discussion', 'admin.php?page=my-jetpack&p=%2Ffeatures%3Fconfigure%3Dcomments' ],
	] )( 'sends %s to %s with the settings flag on', ( route, destination ) => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( route, false );

		expect( getAdminUrl ).toHaveBeenCalledWith( destination );
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' );
		expect( screen.queryByTestId( 'searchable-settings' ) ).not.toBeInTheDocument();
	} );

	it.each( [ '/performance', '/sharing', '/reader', '/writing', '/discussion' ] )(
		'keeps %s on Settings with the settings flag off',
		route => {
			renderAt( route, false );

			expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
		}
	);

	it( 'sends #/sharing to the Social page when it is registered', () => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( '/sharing', false, { hasSocialPage: true } );

		expect( getAdminUrl ).toHaveBeenCalledWith( 'admin.php?page=jetpack-social' );
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' );
		expect( screen.queryByTestId( 'searchable-settings' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps #/security on Settings with the settings flag on and no Protect page', () => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( '/security', false );

		expect( getAdminUrl ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
	} );
} );
