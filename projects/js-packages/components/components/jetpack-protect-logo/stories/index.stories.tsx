import JetpackProtectLogo from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackProtectLogo > = {
	title: 'JS Packages/Components/Jetpack Protect Logo',
	component: JetpackProtectLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

export default meta;

const Template: StoryFn< typeof JetpackProtectLogo > = args => <JetpackProtectLogo { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
	showText: true,
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
