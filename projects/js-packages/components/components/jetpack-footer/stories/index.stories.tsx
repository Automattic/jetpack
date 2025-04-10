import JetpackFooter from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof JetpackFooter > = {
	title: 'JS Packages/Components/Jetpack Footer',
	component: JetpackFooter,
};

export default meta;

const Template: StoryFn< typeof JetpackFooter > = args => <JetpackFooter { ...args } />;

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
