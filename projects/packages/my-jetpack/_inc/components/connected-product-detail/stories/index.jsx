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
import { getAllMockData, getProductSlugs } from './utils.js';

export default {
	title: 'Packages/My Jetpack/Connected Product Detail',
	component: ProductDetailCard,
	decorators: [ withMock ],
	parameters: {
		actions: { argTypesRegex: '^[on|track].*' },
		layout: 'centered',
	},
	argTypes: {
		slug: {
			control: { type: 'select', options: getProductSlugs( true ) },
		},
		isCard: {
			control: { type: 'boolean' },
		},
		onClick: {
			table: {
				disable: true,
			},
		},
		trackButtonClick: {
			table: {
				disable: true,
			},
		},
	},
};

const DefaultProductDetailCard = args => <ProductDetailCard { ...args } />;

export const Default = DefaultProductDetailCard.bind( {} );
Default.parameters = { mockData: getAllMockData() };
Default.args = { slug: 'backup', isCard: true };
