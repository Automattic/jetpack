import JetpackVideoPressLogo from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackVideoPressLogo > = {
	title: 'JS Packages/Components/Jetpack VideoPress Logo',
	component: JetpackVideoPressLogo,
	argTypes: {},
};

export default meta;

const Template: StoryFn< typeof JetpackVideoPressLogo > = args => (
	<JetpackVideoPressLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
