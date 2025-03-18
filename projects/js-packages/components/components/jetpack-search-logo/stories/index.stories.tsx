import JetpackSearchLogo from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackSearchLogo > = {
	title: 'JS Packages/Components/Jetpack Search Logo',
	component: JetpackSearchLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

export default meta;

const Template: StoryFn< typeof JetpackSearchLogo > = args => <JetpackSearchLogo { ...args } />;

const DefaultArgs = {
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
