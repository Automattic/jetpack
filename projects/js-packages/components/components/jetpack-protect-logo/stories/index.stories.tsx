import JetpackProtectLogo from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack Protect Logo',
	component: JetpackProtectLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
} as Meta< typeof JetpackProtectLogo >;

const Template: StoryFn< typeof JetpackProtectLogo > = args => <JetpackProtectLogo { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
	showText: true,
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
