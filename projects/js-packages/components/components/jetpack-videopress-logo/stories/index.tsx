import JetpackVideoPressLogo from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack VideoPress Logo',
	component: JetpackVideoPressLogo,
	argTypes: {},
} as ComponentMeta< typeof JetpackVideoPressLogo >;

const Template: ComponentStory< typeof JetpackVideoPressLogo > = args => (
	<JetpackVideoPressLogo { ...args } />
);

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
