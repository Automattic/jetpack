import AdminPage from '../../admin-page/index.tsx';
import Col from '../../layout/col/index.tsx';
import Container from '../../layout/container/index.tsx';
import AdminSection from '../basic/index.tsx';
import AdminSectionHero from '../hero/index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof AdminSection > = {
	title: 'JS Packages/Components/Admin Sections',
};

export default meta;

// Export additional stories using pre-defined values
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Template: StoryFn< typeof AdminSection > = args => (
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onlyBasic = args => (
	<AdminSection>
		<Container>
			<Col lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Section</h2>
				<p>This is a sample section</p>
			</Col>
		</Container>
	</AdminSection>
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onlyHero = args => (
	<AdminSectionHero>
		<Container>
			<Col lg={ 12 } md={ 8 } sm={ 4 }>
				<h2>Sample Hero Section</h2>
				<p>This is a sample Hero section</p>
			</Col>
		</Container>
	</AdminSectionHero>
);
