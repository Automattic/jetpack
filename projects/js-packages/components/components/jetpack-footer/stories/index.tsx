import JetpackFooter from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

const meta: ComponentMeta< typeof JetpackFooter > = {
	title: 'JS Packages/Components/Jetpack Footer',
	component: JetpackFooter,
};

export default meta;

const Template: ComponentStory< typeof JetpackFooter > = args => <JetpackFooter { ...args } />;

const DefaultArgs = {
	moduleName: 'The Module Name',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
