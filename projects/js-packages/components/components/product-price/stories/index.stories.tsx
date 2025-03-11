import ProductPrice from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

/**
 * Local array of currency codes so we don't need to import from format-currency
 * This is the subset of currencies that are supported by Jetpack
 * See js-packages/plugins/jetpack/extensions/shared/currencies.js
 */
const currencies = [
	'USD',
	'AUD',
	'BRL',
	'CAD',
	'CHF',
	'DKK',
	'EUR',
	'GBP',
	'HKD',
	'INR',
	'JPY',
	'MXN',
	'NOK',
	'NZD',
	'PLN',
	'SEK',
	'SGD',
];

const meta: Meta< typeof ProductPrice > = {
	title: 'JS Packages/Components/Product Price',
	component: ProductPrice,
	argTypes: {
		currency: {
			control: { type: 'select' },
			options: currencies,
		},
	},
};

export default meta;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof ProductPrice > = args => <ProductPrice { ...args } />;

const DefaultArgs = {
	currency: 'USD',
	price: 24.92,
	offPrice: 12.42,
	showNotOffPrice: true,
	isNotConvenientPrice: false,
	hidePriceFraction: false,
	hideDiscountLabel: false,
	promoLabel: 'NEW',
	legend: '/month, paid yearly',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
