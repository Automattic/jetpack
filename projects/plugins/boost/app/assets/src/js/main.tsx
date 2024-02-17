/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	createHashRouter,
	redirect,
	RouterProvider,
	useLocation,
	useParams,
} from 'react-router-dom';
import Upgrade from './pages/upgrade/upgrade';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';
import SettingsPage from '$layout/settings-page/settings-page';
import React, { useEffect } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useGettingStarted } from '$lib/stores/getting-started';
import { useSingleModuleState } from '$features/module/lib/stores';
import ImageSizeAnalysis from './pages/image-size-analysis/image-size-analysis';
import { isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';
import '../css/admin-style.scss';
import CacheDebugLog from './pages/cache-debug-log/cache-debug-log';

const useBoostRouter = () => {
	const { shouldGetStarted } = useGettingStarted();
	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );

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
			path: 'image-size-analysis/:group/:page',
			loader: () => {
				if ( ! isaState?.available ) {
					return redirect( '/' );
				}
				return null;
			},
			element: (
				<Tracks>
					<ISAPage />
				</Tracks>
			),
		},
		{
			path: '/upgrade',
			element: (
				<Tracks>
					<Upgrade />
				</Tracks>
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

const ISAPage = () => {
	const { group, page } = useParams< { group: string; page: string } >();
	const [ imageCdnState ] = useSingleModuleState( 'image_cdn' );
	return (
		<ImageSizeAnalysis
			isImageCdnModuleActive={ !! imageCdnState?.active }
			group={ group as isaGroupKeys }
			page={ parseInt( page || '1', 10 ) }
		/>
	);
};

export default () => {
	return (
		<React.StrictMode>
			<DataSyncProvider>
				<Main />
			</DataSyncProvider>
		</React.StrictMode>
	);
};
