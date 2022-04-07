/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';
import { HashRouter, Routes, Route } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { getAllMockData, getProductSlugs } from '../../connected-product-detail/stories/utils.js';
import ProductInterstitial from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Product Interstitial',
	component: ProductInterstitial,
	decorators: [ withMock ],
	parameters: {
		actions: { argTypesRegex: '^track.*' },
		layout: 'centered',
	},
	argTypes: {
		slug: {
			control: { type: 'select' },
			options: getProductSlugs(),
		},
	},
};

const mockData = getAllMockData();

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <ProductInterstitial { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = { mockData };
Default.args = { slug: 'backup' };
