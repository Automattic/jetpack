import DecorativeCard from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Decorative Card',
	component: DecorativeCard,
} as Meta< typeof DecorativeCard >;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof DecorativeCard > = args => <DecorativeCard { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const Unlink = Template.bind( {} );
Unlink.args = {
	icon: 'unlink',
};
