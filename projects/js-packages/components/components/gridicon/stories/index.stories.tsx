import Gridicon from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Gridicon',
	component: Gridicon,
} as ComponentMeta< typeof Gridicon >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof Gridicon > = args => <Gridicon { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const InfoOutline = Template.bind( {} );
InfoOutline.args = {
	icon: 'info-outline',
};
