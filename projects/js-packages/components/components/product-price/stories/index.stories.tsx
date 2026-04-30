import ProductPrice from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const CURRENCY_OPTIONS = [
	'USD',
	'EUR',
	'GBP',
	'AUD',
	'CAD',
	'BRL',
	'CHF',
	'DKK',
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
			options: CURRENCY_OPTIONS,
		},
		variant: {
			control: { type: 'select' },
			options: [ 'default', 'simple' ],
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

export const SimpleVariant = Template.bind( {} );
SimpleVariant.args = {
	currency: '$',
	price: 18,
	offPrice: 9,
	showNotOffPrice: true,
	variant: 'simple',
	legend: '/month, billed yearly',
	promoLabel: '50% off the first year',
};

export const SimpleVariantNoDiscount = Template.bind( {} );
SimpleVariantNoDiscount.args = {
	currency: '$',
	price: 9,
	variant: 'simple',
	legend: '/month, billed yearly',
	showNotOffPrice: false,
};
