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
import useConfigValue from '../hooks/use-config-value.ts';
import Layout from './components/layout/index.tsx';
import FormsDashboardForms from './forms/index.tsx';
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

	const DashboardIndexRedirect = () => {
		const navigate = useNavigate();
		const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

		useEffect( () => {
			if ( isCentralFormManagementEnabled === undefined ) {
				return;
			}

			// Default landing when no hash/route is set.
			navigate( isCentralFormManagementEnabled ? '/forms' : '/responses', { replace: true } );
		}, [ isCentralFormManagementEnabled, navigate ] );

		return null;
	};

	const router = createHashRouter( [
		{
			path: '/',
			element: <Layout />,
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
