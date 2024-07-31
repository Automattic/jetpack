/**
 * External dependencies
 */
import { get } from 'lodash';
import { createRoot } from 'react-dom/client';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
/**
 * Internal dependencies
 */
import Inbox from './inbox';
import LandingPage from './landing';
import './style.scss';

let settings = {};

export const config = key => get( settings, key );

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	settings = JSON.parse( unescape( container.dataset.config ) );
	delete container.dataset.config;

	const router = createHashRouter( [
		{
			path: '/landing',
			element: <LandingPage />,
		},
		{
			path: '/responses',
			element: <Inbox />,
		},
		{
			path: '/',
			element: <Navigate to="/responses" />,
		},
	] );

	const root = createRoot( container );
	root.render( <RouterProvider router={ router } /> );
} );
