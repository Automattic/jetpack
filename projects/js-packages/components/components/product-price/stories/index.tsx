import { CURRENCIES } from '@automattic/format-currency';
import ProductPrice from '../';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

const meta: ComponentMeta< typeof ProductPrice > = {
	title: 'JS Packages/Components/Product Price',
	component: ProductPrice,
	argTypes: {
		currency: {
			control: { type: 'select', options: Object.keys( CURRENCIES ) },
		},
	},
};

export default meta;

// Export additional stories using pre-defined values
const Template: ComponentStory< typeof ProductPrice > = args => <ProductPrice { ...args } />;

const DefaultArgs = {
	currency: 'USD',
	price: 24.92,
	offPrice: 12.42,
	showNotOffPrice: true,
	isNotConvenientPrice: false,
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
