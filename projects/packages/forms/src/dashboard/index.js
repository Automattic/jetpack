import { render } from '@wordpress/element';
import { get } from 'lodash';
import Inbox from './inbox';
import './style.scss';

let settings = {};

export const config = key => get( settings, key );

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	settings = JSON.parse( unescape( container.dataset.config ) );
	delete container.dataset.config;

	render( <Inbox />, container );
} );
