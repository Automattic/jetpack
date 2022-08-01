import JetpackFooter from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack Footer',
	component: JetpackFooter,
} as ComponentMeta< typeof JetpackFooter >;

const Template: ComponentStory< typeof JetpackFooter > = args => <JetpackFooter { ...args } />;

const DefaultArgs = {
	a8cLogoHref: 'https://automattic.com',
	moduleName: 'Jetpack',
	className: '',
	moduleNameHref: 'https://jetpack.com',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
