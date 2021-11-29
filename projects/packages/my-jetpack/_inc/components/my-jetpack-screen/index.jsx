/**
 * External dependencies
 */
import React from 'react';
import {
	JetpackAdminSection,
	JetpackAdminSectionHero,
	JetpackAdminPage,
} from '@automattic/jetpack-components';

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
				<JetpackAdminSectionHero>Lorem Ipsum</JetpackAdminSectionHero>

				<JetpackAdminSection>Lorem Ipsum</JetpackAdminSection>
			</JetpackAdminPage>
		</div>
	);
}
