import { createHashRouter, redirect, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';
import SettingsPage from '$layout/settings-page/settings-page';
import { useEffect, StrictMode } from 'react';
import type { JSX } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useGettingStarted } from '$lib/stores/getting-started';
import '../css/admin-style.scss';
import CacheDebugLog from './pages/cache-debug-log/cache-debug-log';

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
				<SettingsPage>
					<Tracks>
						<Index />
					</Tracks>
				</SettingsPage>
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
				<SettingsPage>
					<Tracks>
						<AdvancedCriticalCss />
					</Tracks>
				</SettingsPage>
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

function Main() {
	const router = useBoostRouter();
	return <RouterProvider router={ router } />;
}

/**
 * Track the page view.
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

export default () => {
	return (
		<StrictMode>
			<DataSyncProvider>
				<Main />
			</DataSyncProvider>
		</StrictMode>
	);
};
