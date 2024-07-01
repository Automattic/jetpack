/*
 * External Dependencies
 */
import React from 'react';
/*
 * Internal Dependencies
 */
import { UsagePanel } from '..';

export default {
	title: 'Plugins/Jetpack/Extensions/UsagePanel',
	component: UsagePanel,
	parameters: {
		docs: {
			autodocs: false,
		},
	},
};

const DefaultTemplate = args => {
	return <UsagePanel { ...args } />;
};

export const defaultView = DefaultTemplate.bind( {} );
defaultView.args = {
	nextStart: '2024-05-10 00:00:00',
	nextLimit: 200,
	requestsCount: 10,
	requestsLimit: 100,
	planType: 'tiered',
	loading: false,
	canUpgrade: true,
	showContactUsCallToAction: false,
	isRedirecting: false,
};
