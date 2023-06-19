import PricingSlider from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Pricing Slider',
	component: PricingSlider,
} as ComponentMeta< typeof PricingSlider >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof PricingSlider > = args => <PricingSlider { ...args } />;

// Export Default story
export const _default = Template.bind( {} );
