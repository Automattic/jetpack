/**
 * External dependencies
 */
import { render } from '@wordpress/element';
import { get } from 'lodash';
import { createHashRouter, RouterProvider } from 'react-router-dom';
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
			path: '/',
			element: <Inbox />,
		},
		{
			path: '/landing',
			element: <LandingPage />,
		},
	] );

	render( <RouterProvider router={ router } />, container );
} );
