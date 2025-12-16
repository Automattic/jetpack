/**
 * External dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { createRoot } from '@wordpress/element';
import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
/**
 * Internal dependencies
 */
import Layout from './components/layout/index.tsx';
import Inbox from './inbox/index.js';
import DashboardNotices from './notices-list.tsx';
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
					element: <Inbox />,
				},
			],
		},
	] );

	const root = createRoot( container );

	root.render(
		<SlotFillProvider>
			<RouterProvider router={ router } />
			<DashboardNotices />
		</SlotFillProvider>
	);
}

window.jetpackFormsInit = initFormsDashboard;
window.addEventListener( 'load', initFormsDashboard );
