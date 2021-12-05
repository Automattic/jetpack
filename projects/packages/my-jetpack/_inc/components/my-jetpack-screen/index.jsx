/**
 * External dependencies
 */
import React from 'react';
import { AdminSection, AdminSectionHero, AdminPage } from '@automattic/jetpack-components';

import './style.scss';

/**
 * The My Jetpack App Main Screen.
 *
 * @returns {object} The MyJetpackScreen component.
 */
export default function MyJetpackScreen() {
	return (
		<div className="jp-my-jetpack-screen">
			<AdminPage>
				<AdminSectionHero>Lorem Ipsum</AdminSectionHero>

				<AdminSection>Lorem Ipsum</AdminSection>
			</AdminPage>
		</div>
	);
}
