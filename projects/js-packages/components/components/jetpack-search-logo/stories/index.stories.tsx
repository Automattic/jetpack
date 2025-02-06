import JetpackSearchLogo from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack Search Logo',
	component: JetpackSearchLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
} as Meta< typeof JetpackSearchLogo >;

const Template: StoryFn< typeof JetpackSearchLogo > = args => <JetpackSearchLogo { ...args } />;

const DefaultArgs = {
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
