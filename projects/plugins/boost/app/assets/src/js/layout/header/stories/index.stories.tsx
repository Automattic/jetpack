import Header from '../header';
import type { Meta } from '@storybook/react';

const meta: Meta< typeof Header > = {
	title: 'Plugins/Boost/Header',
	component: Header,
	argTypes: {
		subPageTitle: { control: 'text', defaultValue: '' },
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '1320px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const Template = args => <Header { ...args } />;
export const _default = Template.bind( {} );
export default meta;
