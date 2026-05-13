import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import * as WPElement from '@wordpress/element';
import { StrictMode, useEffect } from 'react';
import { createHashRouter, redirect, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { JSX } from 'react';
import CriticalCssProvider from '$features/critical-css/critical-css-context/critical-css-context-provider';
import { NoticeProvider } from '$features/notice/context';
import NoticeManager from '$features/notice/manager';
import { useGettingStarted } from '$lib/stores/getting-started';
import { recordBoostEvent } from '$lib/utils/analytics';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import CacheDebugLog from './pages/cache-debug-log/cache-debug-log';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';
import '../css/admin-style.scss';

const TAB_MOUNT_ID = 'jb-settings-tab-mount';
const CHASSIS_APP_ID = 'jetpack-boost-dashboard-wp-admin-app';

/**
 * Records `page_view*` Tracks events whenever the hash router moves
 * between routes.
 *
 * @param props
 * @param props.children - The actual page to render
 */
const Tracks = ( { children }: { children: JSX.Element } ) => {
	const location = useLocation();

	useEffect( () => {
		let path = location.pathname.replace( /[-/]/g, '_' );
		if ( path === '_' ) {
			path = '_settings';
		}

		recordBoostEvent( `page_view${ path }`, {
			path: location.pathname,
		} );
	}, [ location ] );

	return children;
};

const useBoostRouter = () => {
	const { shouldGetStarted } = useGettingStarted();

	const checkForGettingStarted = () => {
		if ( shouldGetStarted ) {
			return redirect( '/getting-started' );
		}
		return null;
	};

	return createHashRouter( [
		{
			path: '*',
			loader: checkForGettingStarted,
			element: (
				<NoticeProvider>
					<CriticalCssProvider>
						<Tracks>
							<Index />
						</Tracks>
						<NoticeManager />
					</CriticalCssProvider>
				</NoticeProvider>
			),
		},
		{
			path: '/cache-debug-log',
			loader: checkForGettingStarted,
			element: (
				<Tracks>
					<CacheDebugLog />
				</Tracks>
			),
		},
		{
			path: '/critical-css-advanced',
			loader: checkForGettingStarted,
			element: (
				<NoticeProvider>
					<CriticalCssProvider>
						<Tracks>
							<AdvancedCriticalCss />
						</Tracks>
						<NoticeManager />
					</CriticalCssProvider>
				</NoticeProvider>
			),
		},
		{
			path: '/getting-started',
			element: (
				<Tracks>
					<GettingStarted />
				</Tracks>
			),
		},
		{
			path: '/purchase-successful',
			element: (
				<Tracks>
					<PurchaseSuccess />
				</Tracks>
			),
		},
	] );
};

function TabMountApp() {
	const router = useBoostRouter();
	return <RouterProvider router={ router } />;
}

const renderTabMount = ( target: HTMLElement ) => {
	WPElement.createRoot( target ).render(
		<StrictMode>
			<DataSyncProvider>
				<TabMountApp />
			</DataSyncProvider>
		</StrictMode>
	);
};

/**
 * Wait for the wp-build chassis to insert the Settings tab mount-point
 * before mounting. The chassis renders the panel asynchronously after
 * its bundle hydrates, so the element doesn't exist when this script's
 * first pass runs at footer load.
 *
 * @param done
 */
const waitForTabMount = ( done: ( target: HTMLElement ) => void ) => {
	const existing = document.getElementById( TAB_MOUNT_ID );
	if ( existing !== null ) {
		done( existing );
		return;
	}

	const observer = new MutationObserver( () => {
		const target = document.getElementById( TAB_MOUNT_ID );
		if ( target !== null ) {
			observer.disconnect();
			done( target );
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
};

/**
 * Boot the legacy webpack bundle. The wp-build chassis owns the page chrome
 * + Overview tab; this entry waits for the chassis's
 * `#jb-settings-tab-mount` div, then renders a slim hash router (no chassis
 * chrome) into it. Hash routing coexists with the chassis's search-param
 * routing (`?tab=...`); the two never collide.
 */
function render() {
	if ( document.getElementById( CHASSIS_APP_ID ) === null ) {
		return;
	}
	waitForTabMount( renderTabMount );
}

render();
