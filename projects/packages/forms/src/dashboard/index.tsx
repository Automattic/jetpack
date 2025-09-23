/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { createHashRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
/**
 * Internal dependencies
 */
import About from './about';
import Layout from './components/layout';
import Inbox from './inbox';
import Integrations from './integrations';
import DashboardNotices from './notices-list';
import './style.scss';

let settings = {};

export const config = ( key: string ) => settings?.[ key ];

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	settings = JSON.parse( decodeURIComponent( container.dataset.config ) );
	delete container.dataset.config;

	const router = createHashRouter( [
		{
			path: '/',
			element: <Layout />,
			children: [
				{
					index: true,
					element: <Navigate to={ config( 'hasFeedback' ) ? '/responses' : '/about' } />,
				},
				{
					path: 'responses',
					element: <Inbox />,
				},
				{
					path: 'integrations',
					element: <Integrations />,
				},
				{
					path: 'about',
					element: <About />,
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
} );
