import AdminPage from '../../admin-page';
import Col from '../../layout/col';
import Container from '../../layout/container';
import AdminSection from '../basic';
import AdminSectionHero from '../hero';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Admin Sections',
} as ComponentMeta< typeof AdminSection >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof AdminSection > = () => (
	<AdminPage>
		<AdminSectionHero>
			<Container>
				<Col lg={ 12 } md={ 8 } sm={ 4 }>
					<h1>Sample Hero section</h1>
					<p>This is a sample Hero section</p>
				</Col>
			</Container>
		</AdminSectionHero>
		<AdminSection>
			<Container>
				<Col lg={ 12 } md={ 8 } sm={ 4 }>
					<h2>Sample Section</h2>
					<p>This is a sample section</p>
				</Col>
			</Container>
		</AdminSection>
	</AdminPage>
);

// Export Default story
export const _default = Template.bind( {} );

export const onlyBasic = () => (
	<AdminSection>
		<Container>
			<Col lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Section</h2>
				<p>This is a sample section</p>
			</Col>
		</Container>
	</AdminSection>
);

export const onlyHero = () => (
	<AdminSectionHero>
		<Container>
			<Col lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Hero Section</h2>
				<p>This is a sample Hero section</p>
			</Col>
		</Container>
	</AdminSectionHero>
);
