/**
 * External dependencies
 */
import { render } from '@wordpress/element';
import { get } from 'lodash';
import { BrowserRouter } from 'react-router-dom';
/**
 * Internal dependencies
 */
import Inbox from './inbox';
import './style.scss';

let settings = {};

export const config = key => get( settings, key );

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	settings = JSON.parse( unescape( container.dataset.config ) );
	delete container.dataset.config;

	render(
		<BrowserRouter>
			<Inbox />
		</BrowserRouter>,
		container
	);
} );
