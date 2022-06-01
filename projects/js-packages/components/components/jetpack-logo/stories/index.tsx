import type { ComponentStory, ComponentMeta } from '@storybook/react';

import JetpackLogo from '../index';

const meta: ComponentMeta< typeof JetpackLogo > = {
	title: 'JS Packages/Components/Jetpack Logo',
	component: JetpackLogo,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

export default meta;

const Template: ComponentStory< typeof JetpackLogo > = args => <JetpackLogo { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
