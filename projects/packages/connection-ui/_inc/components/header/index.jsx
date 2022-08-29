import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

/**
 * The Connection UI header.
 *
 * @returns {object} The header component.
 */
const Header = () => {
	return (
		<div className="jetpack-cui__header">
			<h1>{ __( 'Connection Manager', 'jetpack-connection-ui' ) }</h1>
		</div>
	);
};

export default Header;
