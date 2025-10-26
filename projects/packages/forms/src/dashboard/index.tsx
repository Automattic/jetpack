/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
/**
 * Internal dependencies
 */
import Layout from './components/layout';
import Inbox from './inbox';
import Integrations from './integrations';
import DashboardNotices from './notices-list';
import './style.scss';

declare global {
	interface Window {
		jetpackFormsInit?: () => void;
	}
}

/**
 * Initialize the Forms dashboard
 */
function initFormsDashboard() {
	const container = document.getElementById( 'jp-forms-dashboard' );

	if ( ! container || container.dataset.formsInitialized ) {
		return;
	}

	container.dataset.formsInitialized = 'true';

	const router = createHashRouter( [
		{
			path: '/',
			element: <Layout />,
			children: [
				{
					index: true,
					element: <Inbox />,
				},
				{
					path: 'responses',
					element: <Inbox />,
				},
				{
					path: 'integrations',
					element: <Integrations />,
				},
			],
		},
	] );

	const root = createRoot( container );

	root.render(
		<ThemeProvider>
			<RouterProvider router={ router } />
			<DashboardNotices />
		</ThemeProvider>
	);
}

window.jetpackFormsInit = initFormsDashboard;
window.addEventListener( 'load', initFormsDashboard );
