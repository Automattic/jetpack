/**
 * External dependencies
 */
import React from 'react';
import withMock from 'storybook-addon-mock';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { getAllMockData } from '../../connected-product-detail/stories/utils.js';

/**
 * Internal dependencies
 */
import ProductCardsSection from '../index.jsx';

export default {
	title: 'Packages/My Jetpack/Product Cards Section',
	component: ProductCardsSection,
	decorators: [ withMock ],
	parameters: {
		actions: { argTypesRegex: '^on.*' },
	},
};

const mockData = getAllMockData();

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <ProductCardsSection { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = { mockData };
Default.args = {};
