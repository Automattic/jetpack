/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../index.jsx';

export default {
	title: 'Plugins/Protect/Product Offer',
	component: ConnectedProductOffer,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		isCard: {
			control: { type: 'boolean' },
		},
	},
};

const DefaultDefaultProductOffer = args => <ConnectedProductOffer { ...args } />;

export const Default = DefaultDefaultProductOffer.bind( {} );
Default.args = {
	isCard: false,
};
