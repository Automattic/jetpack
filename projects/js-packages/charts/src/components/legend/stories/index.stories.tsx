import { BaseLegend } from '../index';
import type { Meta } from '@storybook/react';

const data = [
	{ label: 'Desktop', value: '86%', color: '#3858E9' },
	{ label: 'Mobile', value: '52%', color: '#80C8FF' },
];

export default {
	title: 'JS Packages/Charts/Legend',
	component: BaseLegend,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'A flexible legend component that can be customized with different styles and orientations.',
			},
		},
	},
} satisfies Meta< typeof BaseLegend >;

const Template = args => <BaseLegend { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	items: data,
	orientation: 'horizontal',
};

export const Vertical = Template.bind( {} );
Vertical.args = {
	items: data,
	orientation: 'vertical',
};
