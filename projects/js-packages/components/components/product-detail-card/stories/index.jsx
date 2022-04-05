/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ProductDetailCard from '../index.jsx';

export default {
	title: 'JS Packages/Components/Product Detail Card',
	component: ProductDetailCard,
	decorators: [ withMock ],
	parameters: {
		layout: 'centered',
	},
};

const DefaultProductDetailCard = args => <ProductDetailCard { ...args } />;

export const Default = DefaultProductDetailCard.bind( {} );
Default.parameters = {};
Default.args = {
	slug: 'boost',
	name: 'Boost',
	title: 'Jepack Boost',
	description:
		'Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required.',
	features: [
		'Check your site performance',
		'Enable improvements in one click',
		'Standalone free plugin for those focused on speed',
	],
	pricingForUi: {
		available: true,
		is_free: true,
	},
	supportedProducts: [ 'backup', 'scan', 'anti-spam' ],
};
