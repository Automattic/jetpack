/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import { initStore } from '../../../state/store';
import { jetpackProtectInitialState } from '../../interstitial-page/stories/mock.js';
import { PricingTableFrame } from '../index.jsx';

window.jetpackProtectInitialState = jetpackProtectInitialState;
initStore();

export default {
	title: 'Plugins/Protect/Pricing Table',
	component: PricingTableFrame,
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
	return <PricingTableFrame { ...args } />;
};

export const Default = DefaultDefaultPricingTable.bind( {} );
Default.args = {
	isCard: false,
	onAdd: () => {},
	args: {
		title: 'Stay one step ahead of threats',
		items: [
			{
				name: 'Scan for threats and vulnerabilities',
			},
			{
				name: 'Daily automated scans',
			},
			{
				name: 'Web Application Firewall',
			},
			{
				name: 'Brute force protection',
			},
			{
				name: 'Access to scan on Cloud',
			},
			{
				name: 'One-click auto fixes',
			},
			{
				name: 'Notifications',
			},
			{
				name: 'Severity labels',
			},
		],
	},
	price: 9.99,
	offPrice: 5.99,
	currency: 'CAD',
	getScan: () => {},
	getScanButtonIsLoading: false,
	getProtectFreeButtonIsLoading: false,
	getProtectFree: () => {},
	registrationError: null,
};
