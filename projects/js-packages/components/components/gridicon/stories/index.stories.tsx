import Gridicon from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Gridicon',
	component: Gridicon,
} as Meta< typeof Gridicon >;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof Gridicon > = args => <Gridicon { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const InfoOutline = Template.bind( {} );
InfoOutline.args = {
	icon: 'info-outline',
};
