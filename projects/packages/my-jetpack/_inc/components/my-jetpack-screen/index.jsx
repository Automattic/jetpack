/**
 * External dependencies
 */
import React from 'react';
import { JetpackAdminSection, JetpackAdminPage } from '@automattic/jetpack-components';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	return (
		<div className="jp-my-jetpack-screen">
			<JetpackAdminPage>
				<JetpackAdminSection bgColor="grey">Lorem Ipsum</JetpackAdminSection>

				<JetpackAdminSection>Lorem Ipsum</JetpackAdminSection>
			</JetpackAdminPage>
		</div>
	);
}
