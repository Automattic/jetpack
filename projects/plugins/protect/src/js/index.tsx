import * as WPElement from '@wordpress/element';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './layout';
import FirewallRoute from './routes/firewall';
import ScanRoute from './routes/scan';
import ScanHistoryRoute from './routes/scan/history';
import { initStore } from './state/store';
import './styles.module.scss';

// Initialize Jetpack Protect store
initStore();

const router = createHashRouter( [
	{
		path: '/',
		element: <Layout />,
		children: [
			{
				index: true,
				element: <Navigate to="/scan" replace />,
			},
			{
				path: 'scan',
				element: <ScanRoute />,
			},
			{
				path: 'scan/history',
				element: <ScanHistoryRoute />,
			},
			{
				path: 'scan/history/:filter',
				element: <ScanHistoryRoute />,
			},
			{
				path: 'firewall',
				element: <FirewallRoute />,
			},
		],
	},
] );

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-protect-root' );

	if ( null === container ) {
		return;
	}

	WPElement.createRoot( container ).render( <RouterProvider router={ router } /> );
}

render();
