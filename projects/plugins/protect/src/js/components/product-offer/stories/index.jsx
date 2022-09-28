/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import { initStore } from '../../../state/store';
import { jetpackProtectInitialState } from '../../interstitial/stories/mock.js';
import ConnectedProductOffer from '../index.jsx';

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
	},
};

const DefaultDefaultProductOffer = args => {
	return <ConnectedProductOffer { ...args } />;
};

export const Default = DefaultDefaultProductOffer.bind( {} );
Default.args = {
	isCard: false,
	onAdd: () => {},
};
