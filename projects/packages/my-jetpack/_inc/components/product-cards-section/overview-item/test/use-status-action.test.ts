import { renderHook } from '@testing-library/react';
import useStatusAction from '../use-status-action';

const mockActivate = jest.fn();
const mockConnectSite = jest.fn();
let mockStatus = 'inactive';
const NO_CLICKS = { activate: 0, connect: 0 };

jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: () => 'https://example.org/connect-user',
} ) );
jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { status: mockStatus, requiresUserConnection: false },
} ) );
jest.mock( '../../../../data/products/use-activate-plugins', () => () => ( {
	activate: mockActivate,
	isPending: false,
} ) );
jest.mock( '../../../../hooks/use-connect-site', () => () => ( { connectSite: mockConnectSite } ) );
jest.mock( '../../../../hooks/use-my-jetpack-connection', () => () => ( {
	isRegistered: true,
	isUserConnected: true,
	siteIsRegistering: false,
} ) );
jest.mock( '../../../../hooks/use-my-jetpack-navigate', () => () => jest.fn() );

describe( 'useStatusAction', () => {
	beforeEach( () => jest.clearAllMocks() );

	it.each( [
		[ 'site_connection_error', 'Connect', undefined, { activate: 0, connect: 1 } ],
		[ 'user_connection_error', 'Connect', 'https://example.org/connect-user', NO_CLICKS ],
		[ 'inactive', 'Activate Boost', undefined, { activate: 1, connect: 0 } ],
		[ 'module_disabled', 'Activate Boost', undefined, { activate: 1, connect: 0 } ],
		[ 'plugin_absent', 'Activate Boost', '#/add-boost', NO_CLICKS ],
	] )( 'offers the right link for %s', ( status, label, href, calls ) => {
		mockStatus = status;
		const { result } = renderHook( () => useStatusAction( 'boost', 'Activate Boost' ) );

		const { label: shownLabel, href: shownHref } = result.current.action;
		expect( { label: shownLabel, href: shownHref } ).toEqual( { label, href } );
		result.current.action.onClick?.();
		expect( {
			activate: mockActivate.mock.calls.length,
			connect: mockConnectSite.mock.calls.length,
		} ).toEqual( calls );
	} );
} );
