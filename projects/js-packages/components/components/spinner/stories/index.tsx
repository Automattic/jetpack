import Spinner from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

const meta: ComponentMeta< typeof Spinner > = {
	title: 'JS Packages/Components/Spinner',
	component: Spinner,
	argTypes: {
		color: { control: 'color' },
	},
	parameters: {
		backgrounds: {
			default: 'dark',
		},
	},
};

export default meta;

const Template: ComponentStory< typeof Spinner > = args => <Spinner { ...args } />;

export const _default = Template.bind( {} );
