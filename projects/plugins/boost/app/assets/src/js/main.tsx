import { createHashRouter, redirect, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';
import SettingsPage from '$layout/settings-page/settings-page';
import { useEffect, StrictMode } from 'react';
import type { JSX } from 'react';
import { pageViewEventName, recordBoostEvent } from '$lib/utils/analytics';
import { LegacyNavigationProvider } from '$lib/navigation/navigation-context';
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
					<LegacyRouteFrame>
						<Index />
					</LegacyRouteFrame>
				</SettingsPage>
			),
		},
		{
			path: '/cache-debug-log',
			loader: checkForGettingStarted,
			element: (
				<LegacyRouteFrame>
					<CacheDebugLog />
				</LegacyRouteFrame>
			),
		},
		{
			path: '/critical-css-advanced',
			loader: checkForGettingStarted,
			element: (
				<SettingsPage>
					<LegacyRouteFrame>
						<AdvancedCriticalCss />
					</LegacyRouteFrame>
				</SettingsPage>
			),
		},
		{
			path: '/getting-started',
			element: (
				<LegacyRouteFrame>
					<GettingStarted />
				</LegacyRouteFrame>
			),
		},
		{
			path: '/purchase-successful',
			element: (
				<LegacyRouteFrame>
					<PurchaseSuccess />
				</LegacyRouteFrame>
			),
		},
	] );
};

function Main() {
	const router = useBoostRouter();
	return <RouterProvider router={ router } />;
}

/**
 * Record the page view and provide navigation for a legacy route.
 *
 * @param props
 * @param props.children - The actual page to render
 */
const LegacyRouteFrame = ( { children }: { children: JSX.Element } ) => {
	const location = useLocation();

	useEffect( () => {
		recordBoostEvent( pageViewEventName( location.pathname ), {
			path: location.pathname,
		} );
	}, [ location ] );

	return <LegacyNavigationProvider>{ children }</LegacyNavigationProvider>;
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
