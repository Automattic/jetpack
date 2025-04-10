import AutomatticBylineLogo from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof AutomatticBylineLogo > = {
	title: 'JS Packages/Components/Automattic Byline Logo',
	component: AutomatticBylineLogo,
};

export default meta;

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
