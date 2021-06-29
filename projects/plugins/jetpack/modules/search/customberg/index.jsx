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
import Layout from './components/layout';
import './styles.scss';

/**
 * Initilizes the widgets screen
 *
 * @param {string} id - Id of the root element to render the screen.
 */
export function initialize( id ) {
	render( <Layout />, document.getElementById( id ) );
}

global.jetpackSearchCustomizeInit = initialize;
