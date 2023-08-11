import JetpackFooter from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Jetpack Footer',
	component: JetpackFooter,
} as ComponentMeta< typeof JetpackFooter >;

const Template: ComponentStory< typeof JetpackFooter > = args => <JetpackFooter { ...args } />;

const DefaultArgs = {
	moduleName: 'Jetpack',
	className: '',
	moduleNameHref: 'https://jetpack.com',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const WithMenu = Template.bind( {} );
WithMenu.args = {
	...DefaultArgs,
	menu: [
		{
			label: 'Menu Item',
			href: '#',
		},
		{
			label: 'External Menu Item',
			href: '#',
			target: '_blank',
		},
		{
			label: 'Menu Item With Title',
			title: 'Hello, World!',
			href: '#',
		},
	],
};
