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
 * @returns {JSX.Element} The header component.
 */
export default function Header() {
	return (
		<div className="jetpack-cui__header">
			<h1>{ __( 'Connection Manager', 'jetpack' ) }</h1>

			<p>
				{ __(
					'The Connection Manager handles all your WordPress.com connections in one place.\
						Here is where you can disconnect or connect features that require a WordPress.com connection,\
						as well as, refresh all the reconnections at once in case of connection issues.',
					'jetpack'
				) }
			</p>
		</div>
	);
}
