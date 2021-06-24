/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { JetpackLogo } from '@automattic/jetpack-components';

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
		<div className="jetpack-cui__header">
			<JetpackLogo />
			<h1>{ __( 'Connection Manager', 'jetpack' ) }</h1>
		</div>
	);
};

export default Header;
