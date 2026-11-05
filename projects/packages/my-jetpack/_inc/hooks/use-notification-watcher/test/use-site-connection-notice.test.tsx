import { renderHook } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import { getConnectUrl } from '../../../utils/connect-url';
import { leavePageFor } from '../../../utils/reload-page';
import useConnectSite from '../../use-connect-site';
import useSiteConnectionNotice from '../use-site-connection-notice';
import type { NoticeContextType, NoticeOptions } from '../../../context/notices/types';
import type { MouseEvent, ReactNode } from 'react';

jest.mock( '@automattic/jetpack-connection', () => ( {
	CONNECTION_FROM: jest.requireActual(
		'../../../../../../js-packages/connection/helpers/connection-from'
	).CONNECTION_FROM,
} ) );
jest.mock( '../../../utils/connect-url', () => ( {
	getConnectUrl: jest.fn( () => 'https://wordpress.com/connect' ),
} ) );
jest.mock( '../../../utils/reload-page', () => ( { leavePageFor: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	Col: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: ReactNode } ) => <span>{ children }</span>,
	TermsOfService: () => null,
} ) );
jest.mock( '../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: [], isLoading: false, isError: false } ),
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	refetch: jest.fn(),
} ) );
jest.mock( '../../../data/utils/get-product-slugs-that-require-user-connection', () => () => [] );
jest.mock( '../../use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../use-connect-site', () => jest.fn( () => ( { connectSite: jest.fn() } ) ) );
jest.mock( '../../use-my-jetpack-connection', () => () => ( {
	siteIsRegistering: false,
	isSiteConnected: true,
} ) );

describe( 'useSiteConnectionNotice', () => {
	const renderWithAlert = ( type: 'user' | 'site', isError: boolean ) => {
		const setNotice: jest.MockedFunction< NoticeContextType[ 'setNotice' ] > = jest.fn();
		const contextValue: NoticeContextType = {
			currentNotice: { message: '', options: { level: 'info', priority: 0 } },
			setNotice,
			resetNotice: jest.fn(),
		};

		renderHook(
			() =>
				useSiteConnectionNotice(
					{ 'missing-connection': { type, is_error: isError } } as RedBubbleAlerts,
					false
				),
			{
				wrapper: ( { children } ) => (
					<NoticeContext.Provider value={ contextValue }>{ children }</NoticeContext.Provider>
				),
			}
		);

		return setNotice;
	};

	const withLevel = ( level: NoticeOptions[ 'level' ] ) =>
		expect.objectContaining( { options: expect.objectContaining( { level } ) } );

	it( 'shows a missing user connection as a warning', () => {
		expect( renderWithAlert( 'user', true ) ).toHaveBeenCalledWith( withLevel( 'warning' ) );
	} );

	it( 'shows a missing user connection as a warning even when not flagged as an error', () => {
		expect( renderWithAlert( 'user', false ) ).toHaveBeenCalledWith( withLevel( 'warning' ) );
	} );

	it( 'keeps a broken site connection an error', () => {
		expect( renderWithAlert( 'site', true ) ).toHaveBeenCalledWith( withLevel( 'error' ) );
	} );

	it( 'keeps an unconnected site informational', () => {
		expect( renderWithAlert( 'site', false ) ).toHaveBeenCalledWith( withLevel( 'info' ) );
	} );

	it( 'connects the user as my_jetpack_notice_user, returning to the current page', () => {
		const [ action ] = renderWithAlert( 'user', true ).mock.calls[ 0 ][ 0 ].options.actions ?? [];

		action.onClick( {} as MouseEvent< HTMLButtonElement > );

		expect( getConnectUrl ).toHaveBeenCalledWith( 'my_jetpack_notice_user' );
		expect( leavePageFor ).toHaveBeenCalledWith( 'https://wordpress.com/connect' );
	} );

	it( 'registers the site as my_jetpack_notice_site', () => {
		renderWithAlert( 'site', false );

		expect( useConnectSite ).toHaveBeenCalledWith(
			expect.objectContaining( { from: 'my_jetpack_notice_site' } )
		);
	} );
} );
