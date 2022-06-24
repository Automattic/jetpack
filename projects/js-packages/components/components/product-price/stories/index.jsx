/* eslint-disable react/react-in-jsx-scope */
import { CURRENCIES } from '@automattic/format-currency';
import React from 'react';
import ProductPrice from '../';

export default {
	title: 'JS Packages/Components/Product Price',
	component: ProductPrice,
	argTypes: {
		currency: {
			control: { type: 'select', options: Object.keys( CURRENCIES ) },
		},
	},
};

// Export additional stories using pre-defined values
const Template = args => <ProductPrice { ...args } />;

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
