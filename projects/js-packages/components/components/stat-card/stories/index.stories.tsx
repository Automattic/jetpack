import { Icon, postList } from '@wordpress/icons';
import StatCard from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof StatCard > = {
	title: 'JS Packages/Components/Stat Card',
	component: StatCard,
	argTypes: {
		variant: {
			control: { type: 'radio' },
			options: [ 'square', 'horizontal' ],
		},
		label: {
			control: { type: 'text' },
		},
		value: {
			control: { type: 'number' },
		},
		icon: {
			table: {
				disable: true,
			},
		},
		hideValue: {
			control: { type: 'boolean' },
		},
	},
};

export default meta;

const defaultArgs = {
	icon: <Icon icon={ postList } color="green" />,
	label: 'Posted this month',
	value: 1806,
};

const Template: StoryFn< typeof StatCard > = args => {
	return <StatCard { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = defaultArgs;

export const Horizontal = Template.bind( {} );
Horizontal.args = { ...defaultArgs, variant: 'horizontal' };
