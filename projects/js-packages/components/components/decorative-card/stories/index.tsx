import DecorativeCard from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Decorative Card',
	component: DecorativeCard,
} as ComponentMeta< typeof DecorativeCard >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof DecorativeCard > = args => <DecorativeCard { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const Unlink = Template.bind( {} );
Unlink.args = {
	icon: 'unlink',
};
