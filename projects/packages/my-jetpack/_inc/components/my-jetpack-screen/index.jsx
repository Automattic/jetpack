/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	return (
		<div className="jp-my-jetpack-screen">
			<JetpackLogo />
			<p>Hello Jetpack</p>
			<JetpackFooter
				moduleName={ __( 'Jetpack', 'jetpack' ) }
				a8cLogoHref="https://www.jetpack.com"
			/>
		</div>
	);
}
