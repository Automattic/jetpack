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
import { useEffect } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';

const isGettingStarted = false;

/*
 * For the time being, we will pass the props from a svelte file.
 * Ones the stores are converted to react, we wont need to do this.
 */
type MainProps = {
	indexProps: any;
	upgradeProps: any;
	criticalCssAdvancedProps: any;
	gettingStartedProps: any;
	purchaseSuccessProps: any;
};

const makeRouter = ( {
	upgradeProps,
	indexProps,
	criticalCssAdvancedProps,
	gettingStartedProps,
	purchaseSuccessProps,
}: MainProps ) => {
	const checkIfGettingStarted = () => {
		if ( isGettingStarted ) {
			return redirect( '/getting-started' );
		}
		return null;
	};

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
			loader: checkIfGettingStarted,
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
					<Upgrade { ...upgradeProps } />
				</Tracks>
			),
		},
		{
			path: '/getting-started',
			element: (
				<Tracks>
					<GettingStarted { ...gettingStartedProps } />
				</Tracks>
			),
		},
		{
			path: '/purchase-successful',
			element: (
				<Tracks>
					<PurchaseSuccess { ...purchaseSuccessProps } />
				</Tracks>
			),
		},
	] );
};

export default function Main( props: MainProps ) {
	const router = makeRouter( props );
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
