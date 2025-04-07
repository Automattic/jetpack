import JetpackLogo from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackLogo > = {
	title: 'JS Packages/Components/Jetpack Logo',
	component: JetpackLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

export default meta;

const Template: StoryFn< typeof JetpackLogo > = args => <JetpackLogo { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
