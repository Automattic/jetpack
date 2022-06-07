import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import withMock from 'storybook-addon-mock';
import { getAllMockData } from '../../product-detail-card/stories/utils.js';
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
