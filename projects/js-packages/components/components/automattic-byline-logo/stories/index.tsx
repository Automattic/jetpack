import AutomatticBylineLogo from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Automattic Byline Logo',
	component: AutomatticBylineLogo,
} as ComponentMeta< typeof AutomatticBylineLogo >;

const Template: ComponentStory< typeof AutomatticBylineLogo > = args => (
	<AutomatticBylineLogo { ...args } />
);

const DefaultArgs = {
	title: 'Title',
	height: '50px',
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
