/**
 * External dependencies
 */
import React from 'react';
import JetpackAdminSection from '../basic';
import JetpackAdminSectionHero from '../hero';
import JetpackAdminPage from '../../admin-page';

export default {
	title: 'Playground/Admin Sections',
};

// Export additional stories using pre-defined values
const Template = () => (
	<JetpackAdminPage>
		<JetpackAdminSectionHero>
			<h1>Sample Hero section</h1>
			<p>This is a sample Hero section</p>
		</JetpackAdminSectionHero>
		<JetpackAdminSection>
			<h2>Sample Section</h2>
			<p>This is a sample section</p>
		</JetpackAdminSection>
	</JetpackAdminPage>
);

// Export Default story
export const _default = Template.bind( {} );

export const onlyBasic = () => (
	<JetpackAdminSection>
		<h2>Sample Section</h2>
		<p>This is a sample section</p>
	</JetpackAdminSection>
);

export const onlyHero = () => (
	<JetpackAdminSectionHero>
		<h1>Sample Hero section</h1>
		<p>This is a sample Hero section</p>
	</JetpackAdminSectionHero>
);
