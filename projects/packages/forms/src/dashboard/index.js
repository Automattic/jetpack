import { render } from '@wordpress/element';
import { get } from 'lodash';
// eslint-disable-next-line
import Inbox from './inbox';
import './style.scss';
import LandingPage from './landing';

let settings = {};

export const config = key => get( settings, key );

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	settings = JSON.parse( unescape( container.dataset.config ) );
	delete container.dataset.config;

	//FIXME
	//render( <Inbox />, container );
	render( <LandingPage />, container );
} );
