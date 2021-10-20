/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';

/**
 * The My Jetpack App.
 *
 * @returns {object} The MyJetpack component.
 */
export default function MyJetpack() {
	return (
		<React.Fragment>
			<JetpackLogo />
			<p>Hello Jetpack</p>
			<JetpackFooter
				moduleName={ __( 'Jetpack', 'jetpack' ) }
				a8cLogoHref="https://www.jetpack.com"
			/>
		</React.Fragment>
	);
}
