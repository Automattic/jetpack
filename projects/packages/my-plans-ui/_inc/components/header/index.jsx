/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The Connection UI header.
 *
 * @returns {object} The header component.
 */
const Header = () => {
	return (
		<div className="jetpack-mpui__header">
			<h1>{ __( 'My Plans', 'jetpack' ) }</h1>
		</div>
	);
};

export default Header;
