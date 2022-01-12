/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ProductCard from '../index.jsx';

export default {
	title: 'My Jetpack/Product Card',
	component: ProductCard,
	argTypes: {
		logoColor: { control: 'color' },
	},
};

const Template = args => <ProductCard { ...args } />;

const DefaultArgs = {
	width: 150,
	className: 'sample-classname',
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;
