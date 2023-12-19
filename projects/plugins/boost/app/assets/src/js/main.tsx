/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Upgrade from './pages/upgrade/upgrade';
import Index from './pages/index';
import AdvancedCriticalCss from './pages/critical-css-advanced/critical-css-advanced';
import GettingStarted from './pages/getting-started/getting-started';
import PurchaseSuccess from './pages/purchase-success/purchase-success';

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
	return createHashRouter( [
		{
			path: '/',
			element: <Index { ...indexProps } />,
		},
		{
			path: '/critical-css-advanced',
			element: <AdvancedCriticalCss { ...criticalCssAdvancedProps } />,
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
