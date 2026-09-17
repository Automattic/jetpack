import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSyncExternalStore as mockUseSyncExternalStore } from 'react';
import { Link as MockLink } from 'react-router';
import Main from './main';
import { useLocalCriticalCssGenerator as mockUseLocalCriticalCssGenerator } from '$features/critical-css/critical-css-context/critical-css-context-provider';
import { runLocalGenerator } from '$features/critical-css/lib/generate-critical-css';
import type { CriticalCssState } from '$features/critical-css/lib/stores/critical-css-state-types';

let mockCssState: CriticalCssState;
const mockListeners = new Set< () => void >();
const mockSubscribe = ( listener: () => void ) => {
	mockListeners.add( listener );
	return () => mockListeners.delete( listener );
};
const mockSetCssState = jest.fn();

jest.mock( 'react-router', () => {
	global.TextEncoder = jest.requireActual( 'node:util' ).TextEncoder;
	return {
		...jest.requireActual( 'react-router' ),
		createHashRouter: ( routes: unknown ) => routes,
	};
} );
jest.mock( 'react-router/dom', () => ( {
	RouterProvider: ( { router }: { router: { path: string; element: React.ReactNode }[] } ) => {
		const { HashRouter, Routes, Route } = jest.requireActual( 'react-router' );
		return (
			<HashRouter>
				<Routes>
					{ router.map( route => (
						<Route key={ route.path } path={ route.path } element={ route.element } />
					) ) }
				</Routes>
			</HashRouter>
		);
	},
} ) );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	...jest.requireActual( '$features/critical-css/lib/stores/critical-css-state' ),
	useCriticalCssState: () => [
		mockUseSyncExternalStore( mockSubscribe, () => mockCssState ),
		mockSetCssState,
	],
	useProxyNonce: () => 'proxy-nonce',
	useSetProviderCssAction: () => ( { mutateAsync: jest.fn() } ),
	useSetProviderErrorsAction: () => ( { mutateAsync: jest.fn() } ),
	useRegenerateCriticalCssAction: () => ( { mutate: jest.fn() } ),
} ) );
jest.mock( '$features/critical-css/lib/generate-critical-css', () => ( {
	runLocalGenerator: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	...jest.requireActual( '@automattic/jetpack-react-data-sync-client' ),
	DataSyncProvider: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.mock( '$lib/stores/getting-started', () => ( {
	useGettingStarted: () => ( { shouldGetStarted: false } ),
} ) );
jest.mock( '$lib/stores/premium-features', () => ( { usePremiumFeatures: () => [] } ) );
jest.mock( '$lib/utils/analytics', () => ( {
	getPageViewEventName: () => 'page_view',
	recordBoostEvent: jest.fn(),
} ) );
jest.mock( '$features/speed-score/speed-score', () => () => null );
jest.mock( '$layout/boost-admin-page/boost-admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => children,
} ) );
jest.mock( '$layout/settings-page/support/support', () => () => null );
jest.mock( '$layout/settings-page/tips/tips', () => () => null );
jest.mock( '$features/notice/manager', () => () => null );
jest.mock( './pages/index', () => ( {
	__esModule: true,
	default: function Settings() {
		const { stoppedRun } = mockUseLocalCriticalCssGenerator();
		return (
			<>
				<span>{ stoppedRun?.message }</span>
				<MockLink to="/cache-debug-log">Cache Debug Log</MockLink>
			</>
		);
	},
} ) );
jest.mock( './pages/cache-debug-log/cache-debug-log', () => () => (
	<MockLink to="/">Settings</MockLink>
) );
jest.mock( './pages/critical-css-advanced/critical-css-advanced', () => () => null );
jest.mock( './pages/getting-started/getting-started', () => () => null );
jest.mock( './pages/purchase-success/purchase-success', () => () => null );

it( 'keeps a rolled-back failed run stopped after leaving and returning to legacy Settings', async () => {
	window.history.replaceState( null, '', '/#/' );
	mockCssState = {
		status: 'pending',
		created: 100,
		providers: [
			{
				key: 'core_front_page',
				label: 'Front page',
				urls: [ '/' ],
				success_ratio: 1,
				status: 'pending',
			},
		],
	};
	const generator = jest.mocked( runLocalGenerator );
	generator.mockReturnValue( new AbortController() );
	render( <Main /> );
	await waitFor( () => expect( generator ).toHaveBeenCalled() );
	const runs = generator.mock.calls.length;
	const callbacks = generator.mock.calls[ runs - 1 ][ 2 ];
	const pending = mockCssState;

	act( () => {
		callbacks.onError( new Error( 'DS request failed: 500' ) );
		callbacks.onFinished( false );
	} );
	act( () => {
		mockCssState = { providers: [], status: 'error', status_error: 'DS request failed: 500' };
		mockListeners.forEach( listener => listener() );
	} );
	act( () => {
		mockCssState = pending;
		mockListeners.forEach( listener => listener() );
	} );

	fireEvent.click( screen.getByRole( 'link', { name: 'Cache Debug Log' } ) );
	fireEvent.click( await screen.findByRole( 'link', { name: 'Settings' } ) );
	await screen.findByRole( 'link', { name: 'Cache Debug Log' } );

	expect( generator ).toHaveBeenCalledTimes( runs );
	expect( screen.getByText( 'DS request failed: 500' ) ).toBeTruthy();
} );
