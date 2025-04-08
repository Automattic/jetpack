import DecorativeCard from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof DecorativeCard > = {
	title: 'JS Packages/Components/Decorative Card',
	component: DecorativeCard,
};

export default meta;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof DecorativeCard > = args => <DecorativeCard { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const Unlink = Template.bind( {} );
Unlink.args = {
	icon: 'unlink',
};
