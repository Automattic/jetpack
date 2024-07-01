/* eslint-disable react/react-in-jsx-scope */
import React from 'react';
import { initStore } from '../../../state/store';
import InterstitialPage from '../index.jsx';
import { jetpackProtectInitialState } from './mock';

// Init mocked store.
window.jetpackProtectInitialState = jetpackProtectInitialState;
initStore();

export default {
	title: 'Plugins/Protect/Interstitial Page',
	component: InterstitialPage,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
};

const InterstitialTemplate = args => <InterstitialPage { ...args } />;
export const Default = InterstitialTemplate.bind( {} );
