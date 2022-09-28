/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import withMock from 'storybook-addon-mock';
import ConnectedProductOffer from '../index.jsx';
import { getAllMockData, getProductSlugs } from './utils.js';

export default {
	title: 'Packages/My Jetpack/Connected Product Offer',
	component: ConnectedProductOffer,
	decorators: [ withMock ],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		slug: {
			control: { type: 'select', options: getProductSlugs( true ) },
		},
		isCard: {
			control: { type: 'boolean' },
		},
	},
};

const mockData = getAllMockData();

const DefaultDefaultProductOffer = args => <ConnectedProductOffer { ...args } />;

export const Default = DefaultDefaultProductOffer.bind( {} );
Default.parameters = { mockData };
Default.args = {
	slug: 'backup',
	isCard: false,
};
