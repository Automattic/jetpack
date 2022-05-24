/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../index.jsx';
import { initStore } from '../../../state/store';
import { jetpackProtectInitialState } from '../../interstitial/stories/mock.js';

window.jetpackProtectInitialState = jetpackProtectInitialState;
initStore();

export default {
	title: 'Plugins/Protect/Product Offer',
	component: ConnectedProductOffer,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	argTypes: {
		isCard: {
			control: { type: 'boolean' },
		},
		showError: {
			control: { type: 'boolean' },
		},
	},
};

const DefaultDefaultProductOffer = args => {
	return <ConnectedProductOffer { ...args } />;
};

export const Default = DefaultDefaultProductOffer.bind( {} );
Default.args = {
	isCard: false,
	showError: false,
	onAdd: () => {},
};
