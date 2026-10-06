import { renderHook } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import usePaidPlanNeedsPluginInstallActivationNotice from '../use-paid-plan-needs-plugin-install-activation-notice';
import type { NoticeContextType } from '../../../context/notices/types';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-components', () => ( {
	Col: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: ReactNode } ) => <span>{ children }</span>,
	getRedirectUrl: jest.fn( () => 'https://example.com' ),
} ) );
jest.mock( '../../../data/use-simple-query', () => () => ( {
	data: [ { ID: 1, product_slug: 'jetpack_complete', product_name: 'Jetpack Complete' } ],
	isLoading: false,
	isError: false,
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {
		siteSuffix: 'example.com',
		products: {
			items: {
				search: { plugin_slug: 'jetpack', title: 'Search' },
				stats: { plugin_slug: 'jetpack', title: 'Stats' },
			},
		},
	} ),
} ) );
jest.mock( '../../../data/products/use-activate-plugins', () => () => ( {
	activate: jest.fn(),
	isPending: false,
} ) );
jest.mock( '../../../data/products/use-install-plugins', () => () => ( {
	install: jest.fn(),
	isPending: false,
} ) );
jest.mock( '../../use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../use-my-jetpack-connection', () => () => ( { isSiteConnected: true } ) );

describe( 'usePaidPlanNeedsPluginInstallActivationNotice', () => {
	it( 'counts products that share a plugin as one plugin', () => {
		const setNotice: jest.MockedFunction< NoticeContextType[ 'setNotice' ] > = jest.fn();
		const contextValue: NoticeContextType = {
			currentNotice: { message: '', options: { level: 'info', priority: 0 } },
			setNotice,
			resetNotice: jest.fn(),
		};

		renderHook(
			() =>
				usePaidPlanNeedsPluginInstallActivationNotice(
					{
						'jetpack_complete--plugins_needing_installed_activated': {
							needs_activated_only: [ 'search', 'stats' ],
						},
					} as unknown as RedBubbleAlerts,
					false
				),
			{
				wrapper: ( { children } ) => (
					<NoticeContext.Provider value={ contextValue }>{ children }</NoticeContext.Provider>
				),
			}
		);

		expect( setNotice ).toHaveBeenCalledWith(
			expect.objectContaining( {
				title: 'Plugin activation needed',
				options: expect.objectContaining( {
					actions: [
						expect.objectContaining( {
							label: 'Activate 1 plugin in one click',
							loadingText: 'Activating 1 plugin…',
						} ),
					],
				} ),
			} )
		);
	} );
} );
