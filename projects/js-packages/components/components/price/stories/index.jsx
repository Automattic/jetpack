/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import { CURRENCIES } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import Price from '../';

export default {
	title: 'JS Packages/Components/Price',
	component: Price,
	argTypes: {
		currency: {
			control: { type: 'select', options: Object.keys( CURRENCIES ) },
		},
	},
};

// Export additional stories using pre-defined values
const Template = args => <Price { ...args } />;

const DefaultArgs = {
	currency: 'USD',
	value: 299.99,
	isOld: false,
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
