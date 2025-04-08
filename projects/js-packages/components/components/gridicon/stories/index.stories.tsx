import Gridicon from '../index.js';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof Gridicon > = {
	title: 'JS Packages/Components/Gridicon',
	component: Gridicon,
};

export default meta;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof Gridicon > = args => <Gridicon { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const InfoOutline = Template.bind( {} );
InfoOutline.args = {
	icon: 'info-outline',
};
