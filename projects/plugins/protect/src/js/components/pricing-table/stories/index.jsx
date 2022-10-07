/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import { initStore } from '../../../state/store';
import { jetpackProtectInitialState } from '../../interstitial/stories/mock.js';
import ConnectedPricingTable from '../index.jsx';

window.jetpackProtectInitialState = jetpackProtectInitialState;
initStore();

export default {
	title: 'Plugins/Protect/Pricing Table',
	component: ConnectedPricingTable,
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

const DefaultDefaultPricingTable = args => {
	return <ConnectedPricingTable { ...args } />;
};

export const Default = DefaultDefaultPricingTable.bind( {} );
Default.args = {
	isCard: false,
	onAdd: () => {},
};
