import { getAdminUrl, isWoASite } from '@automattic/jetpack-script-data';
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
	isWoASite: jest.fn( () => false ),
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
		isWoASite.mockReturnValue( false );
		jest.clearAllMocks();
	} );

	it.each( [
		[ '/performance', 'admin.php?page=my-jetpack#/features?search=cdn' ],
		[ '/sharing', 'admin.php?page=my-jetpack#/features?search=sharing' ],
		[ '/reader', 'admin.php?page=my-jetpack#/features?search=reader' ],
		[ '/writing', 'admin.php?page=my-jetpack#/features' ],
		[ '/discussion', 'admin.php?page=my-jetpack&p=%2Ffeatures%3Fconfigure%3Dcomments' ],
		[ '/traffic', 'admin.php?page=my-jetpack#/features' ],
		[ '/settings', 'admin.php?page=my-jetpack#/features' ],
		[ '/privacy', 'profile.php#jetpack-privacy' ],
	] )( 'sends %s to %s with the settings flag on and no tab left', ( route, destination ) => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( route, false, { remainingTabs: [] } );

		expect( getAdminUrl ).toHaveBeenCalledWith( destination );
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' );
		expect( screen.queryByTestId( 'searchable-settings' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		'/performance',
		'/sharing',
		'/reader',
		'/writing',
		'/discussion',
		'/traffic',
		'/settings',
		'/privacy',
	] )( 'keeps %s on Settings with the settings flag off', route => {
		renderAt( route, false );

		expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
	} );

	it( 'sends #/reader to Features without a search on WoA, where the Reader row is hidden', () => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		isWoASite.mockReturnValue( true );
		renderAt( '/reader', false, { remainingTabs: [] } );

		expect( getAdminUrl ).toHaveBeenCalledWith( 'admin.php?page=my-jetpack#/features' );
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' );
	} );

	it( 'sends #/sharing to the Social page when it is registered', () => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( '/sharing', false, { hasSocialPage: true } );

		expect( getAdminUrl ).toHaveBeenCalledWith( 'admin.php?page=jetpack-social' );
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' );
		expect( screen.queryByTestId( 'searchable-settings' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ '/traffic', 'while the Traffic tab is left', [ 'traffic' ], '' ],
		[ '/settings', 'while a tab is left', [ 'security' ], '' ],
		[ '/settings', 'for a search', [], '?term=sso' ],
	] )( 'keeps %s on Settings %s', ( pathname, _when, remainingTabs, search ) => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( pathname, false, { remainingTabs, location: { pathname, search } } );

		expect( getAdminUrl ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
	} );

	it( 'keeps #/security on Settings with the settings flag on and no Protect page', () => {
		isSettingsConsolidationEnabled.mockReturnValue( true );
		renderAt( '/security', false );

		expect( getAdminUrl ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'searchable-settings' ) ).toBeInTheDocument();
	} );
} );
