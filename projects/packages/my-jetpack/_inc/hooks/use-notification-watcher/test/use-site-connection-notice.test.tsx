import { renderHook } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import useSiteConnectionNotice from '../use-site-connection-notice';
import type { NoticeContextType, NoticeOptions } from '../../../context/notices/types';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-connection', () => ( {
	getUserConnectionUrl: jest.fn( () => '' ),
} ) );
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
jest.mock( '../../use-connect-site', () => () => ( { connectSite: jest.fn() } ) );
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
} );
