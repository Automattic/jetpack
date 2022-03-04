/* eslint-disable react/react-in-jsx-scope */

/**
 * External dependencies
 */
import React from 'react';

import { HashRouter, Routes, Route } from 'react-router-dom';
import withMock from 'storybook-addon-mock';

/**
 * Internal dependencies
 */
import ConnectedProductCard from '../';
import { initStore } from '../../../state/store';
import { getAllMockData, getProductSlugs } from '../../product-detail-card/stories/utils.js';

// Set myJetpackRest global var.
window.myJetpackRest = {};

const mockData = getAllMockData();

initStore();

export default {
	title: 'Packages/My Jetpack/Connected Product Card',
	component: ConnectedProductCard,
	decorators: [ withMock ],
	argTypes: {
		slug: {
			options: getProductSlugs(),
			control: { type: 'select' },
		},
	},
};

const Template = args => (
	<HashRouter>
		<Routes>
			<Route path="/" element={ <ConnectedProductCard { ...args } /> } />
		</Routes>
	</HashRouter>
);

export const Default = Template.bind( {} );
Default.parameters = { mockData };
Default.args = {
	admin: false,
	slug: 'backup',
};
