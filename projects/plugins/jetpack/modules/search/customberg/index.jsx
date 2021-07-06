/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './styles.scss';

/**
 * Collapses wp-admin's sidebar menu for additional space.
 */
function collapseWpAdminSidebar() {
	document.body.classList.add( 'folded' );
}

/**
 * Initilizes the widgets screen
 *
 * @param {string} id - Id of the root element to render the screen.
 */
export function initialize( id ) {
	collapseWpAdminSidebar();
	render( <div>Customberg is here!</div>, document.getElementById( id ) );
}

global.jetpackSearchCustomizeInit = initialize;
