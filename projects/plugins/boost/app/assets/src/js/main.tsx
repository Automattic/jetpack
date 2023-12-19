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
import { useCallback, useEffect } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useGettingStarted } from '$lib/stores/getting-started';
import { useSingleModuleState } from '$features/module/lib/stores';

/*
 * For the time being, we will pass the props from a svelte file.
 * Ones the stores are converted to react, we wont need to do this.
 */
type MainProps = {
	connection: {
		connected: boolean;
		userConnected: boolean;
	};
	indexProps: any;
	criticalCssAdvancedProps: any;
};

const useBoostRouter = ( { connection, indexProps, criticalCssAdvancedProps }: MainProps ) => {
	const { shouldGetStarted } = useGettingStarted();
	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );

	const checkIfGettingStarted = useCallback( () => {
		if ( shouldGetStarted ) {
			return redirect( '/getting-started' );
		}
		return null;
	}, [ shouldGetStarted ] );

	return createHashRouter( [
		{
			path: '/',
			loader: checkIfGettingStarted,
			element: (
				<Tracks>
					<Index { ...indexProps } />
				</Tracks>
			),
		},
		{
			path: '/critical-css-advanced',
			loader: checkIfGettingStarted,
			element: (
				<Tracks>
					<AdvancedCriticalCss { ...criticalCssAdvancedProps } />
				</Tracks>
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
					<Upgrade userConnected={ connection.userConnected } />
				</Tracks>
			),
		},
		{
			path: '/getting-started',
			element: (
				<Tracks>
					<GettingStarted userConnected={ connection.userConnected } />
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

function Main( props: MainProps ) {
	const router = useBoostRouter( { ...props } );
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
	return (
		<h1>
			ISA Page for group: { group }, page: { page }
		</h1>
	);
};

export default ( props: MainProps ) => {
	return (
		<DataSyncProvider>
			<Main { ...props } />
		</DataSyncProvider>
	);
};
