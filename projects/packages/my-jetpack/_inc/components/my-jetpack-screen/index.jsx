/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { JetpackAdminSection, JetpackFooter, JetpackLogo } from '@automattic/jetpack-components';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	return (
		<div className="jp-my-jetpack-screen">
			<JetpackAdminSection padding="header">
				<JetpackLogo />
			</JetpackAdminSection>

			<JetpackAdminSection jpHero>Lorem Ipsum</JetpackAdminSection>

			<JetpackAdminSection padding="footer">
				<JetpackFooter
					moduleName={ __( 'Jetpack', 'jetpack' ) }
					a8cLogoHref="https://www.jetpack.com"
				/>
			</JetpackAdminSection>
		</div>
	);
}
