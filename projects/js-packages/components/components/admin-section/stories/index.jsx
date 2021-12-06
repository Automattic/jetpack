/**
 * External dependencies
 */
import React from 'react';
import AdminSection from '../basic';
import AdminSectionHero from '../hero';
import AdminPage from '../../admin-page';
import Grid from '../../layout/grid';
import Row from '../../layout/row';

export default {
	title: 'Playground/Admin Sections',
};

// Export additional stories using pre-defined values
const Template = () => (
	<AdminPage>
		<AdminSectionHero>
			<Row>
				<Grid lg={ 12 } md={ 8 } sm={ 4 }>
					<h1>Sample Hero section</h1>
					<p>This is a sample Hero section</p>
				</Grid>
			</Row>
		</AdminSectionHero>
		<AdminSection>
			<Row>
				<Grid lg={ 12 } md={ 8 } sm={ 4 }>
					<h2>Sample Section</h2>
					<p>This is a sample section</p>
				</Grid>
			</Row>
		</AdminSection>
	</AdminPage>
);

// Export Default story
export const _default = Template.bind( {} );

export const onlyBasic = () => (
	<AdminSection>
		<Row>
			<Grid lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Section</h2>
				<p>This is a sample section</p>
			</Grid>
		</Row>
	</AdminSection>
);

export const onlyHero = () => (
	<AdminSectionHero>
		<Row>
			<Grid lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Hero Section</h2>
				<p>This is a sample Hero section</p>
			</Grid>
		</Row>
	</AdminSectionHero>
);
