/**
 * External dependencies
 */
import React from 'react';
import AdminSection from '../basic';
import AdminSectionHero from '../hero';
import AdminPage from '../../admin-page';

export default {
	title: 'Playground/Admin Sections',
};

// Export additional stories using pre-defined values
const Template = () => (
	<AdminPage>
		<AdminSectionHero>
			<h1>Sample Hero section</h1>
			<p>This is a sample Hero section</p>
		</AdminSectionHero>
		<AdminSection>
			<h2>Sample Section</h2>
			<p>This is a sample section</p>
		</AdminSection>
	</AdminPage>
);

// Export Default story
export const _default = Template.bind( {} );

export const onlyBasic = () => (
	<AdminSection>
		<h2>Sample Section</h2>
		<p>This is a sample section</p>
	</AdminSection>
);

export const onlyHero = () => (
	<AdminSectionHero>
		<h1>Sample Hero section</h1>
		<p>This is a sample Hero section</p>
	</AdminSectionHero>
);
