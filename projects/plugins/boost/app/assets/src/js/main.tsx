/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHashRouter, redirect, RouterProvider, useParams } from 'react-router-dom';
import Upgrade from './pages/upgrade/upgrade';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';

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
			element: <Index { ...indexProps } />,
		},
		{
			path: '/critical-css-advanced',
			loader: checkIfGettingStarted,
			element: <AdvancedCriticalCss { ...criticalCssAdvancedProps } />,
		},
		{
			path: 'image-size-analysis/:group/:page',
			loader: checkIfGettingStarted,
			element: <ISAPage />,
		},
		{
			path: '/upgrade',
			element: <Upgrade { ...upgradeProps } />,
		},
		{
			path: '/getting-started',
			element: <GettingStarted { ...gettingStartedProps } />,
		},
		{
			path: '/purchase-successful',
			element: <PurchaseSuccess { ...purchaseSuccessProps } />,
		},
	] );
};

export default function Main( props: MainProps ) {
	return <RouterProvider router={ makeRouter( props ) } />;
}

const ISAPage = () => {
	const { group, page } = useParams< { group: string; page: string } >();
	return (
		<h1>
			ISA Page for group: { group }, page: { page }
		</h1>
	);
};
