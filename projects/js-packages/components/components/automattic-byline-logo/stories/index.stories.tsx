import AutomatticBylineLogo from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Automattic Byline Logo',
	component: AutomatticBylineLogo,
} as Meta< typeof AutomatticBylineLogo >;

const Template: StoryFn< typeof AutomatticBylineLogo > = args => (
	<AutomatticBylineLogo { ...args } />
);

const DefaultArgs = {
	title: 'Title',
	height: '50px',
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
