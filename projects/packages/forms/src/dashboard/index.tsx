/**
 * External dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { createRoot, useEffect } from '@wordpress/element';
import { createHashRouter, useNavigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
/**
 * Internal dependencies
 */
import Layout from './components/layout/index.tsx';
import FormsDashboardForms from './forms/index.tsx';
import SingleFormResponses from './forms/single/index.tsx';
import Inbox from './inbox/index.js';
import DashboardNotices from './notices-list.tsx';
import ReactRouterDashboardSearchParamsProvider from './router/react-router-dashboard-search-params-provider.tsx';
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

	const DashboardIndexRedirect = () => {
		const navigate = useNavigate();

		useEffect( () => {
			// Default landing when no hash/route is set.
			// Treat undefined (not yet loaded / not provided) as false so we never render a blank page.
			navigate( '/responses', {
				replace: true,
			} );
		}, [ navigate ] );

		return null;
	};

	const DashboardRoot = () => (
		<ReactRouterDashboardSearchParamsProvider>
			<Layout />
		</ReactRouterDashboardSearchParamsProvider>
	);

	const router = createHashRouter( [
		{
			path: '/',
			element: <DashboardRoot />,
			children: [
				{
					index: true,
					element: <DashboardIndexRedirect />,
				},
				{
					path: 'forms',
					element: <FormsDashboardForms />,
				},
				{
					path: 'forms/:formId/responses',
					element: <SingleFormResponses />,
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
