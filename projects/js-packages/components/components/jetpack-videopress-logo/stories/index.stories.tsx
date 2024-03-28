import JetpackVideoPressLogo from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack VideoPress Logo',
	component: JetpackVideoPressLogo,
	argTypes: {},
} as Meta< typeof JetpackVideoPressLogo >;

const Template: StoryFn< typeof JetpackVideoPressLogo > = args => (
	<JetpackVideoPressLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
