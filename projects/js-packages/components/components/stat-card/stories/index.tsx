import { Icon, postList } from '@wordpress/icons';
import StatCard from '..';
import Doc from './StatCard.mdx';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Stat Card',
	component: StatCard,
	parameters: {
		docs: {
			page: Doc,
		},
	},
	argTypes: {
		variant: {
			control: { type: 'radio', options: [ 'square', 'horizontal' ] },
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
	},
} as ComponentMeta< typeof StatCard >;

const defaultArgs = {
	icon: <Icon icon={ postList } color="green" />,
	label: 'Posted this month',
	value: 1806,
};

const Template: ComponentStory< typeof StatCard > = args => {
	return <StatCard { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = defaultArgs;

export const Horizontal = Template.bind( {} );
Horizontal.args = { ...defaultArgs, variant: 'horizontal' };
