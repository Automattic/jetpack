import { CURRENCIES } from '@automattic/format-currency';
import ProductPrice from '../';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Product Price',
	component: ProductPrice,
	argTypes: {
		currency: {
			control: { type: 'select', options: Object.keys( CURRENCIES ) },
		},
	},
} as ComponentMeta< typeof ProductPrice >;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof ProductPrice > = args => <ProductPrice { ...args } />;

const DefaultArgs = {
	currency: 'USD',
	price: 24.92,
	offPrice: 12.42,
	showNotOffPrice: true,
	isNotConvenientPrice: false,
	hidePriceFraction: false,
	hideDiscountLabel: false,
	promoLabel: 'NEW',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
