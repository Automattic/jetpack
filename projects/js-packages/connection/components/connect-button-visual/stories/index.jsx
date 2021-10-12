/**
 * External dependencies
 */
import React from 'react';
import ConnectButtonVisual from '../index.jsx';
import { text, boolean } from '@storybook/addon-knobs';

export default {
	title: 'Playground/Connect Button',
	component: ConnectButtonVisual,
};

// Export Default story using knobs
export const _default = () => {
	const componentProps = {
		connectLabel: text( 'Label', 'Connect' ),
		onButtonClick: () => {
			return;
		},
		connectionStatus: {
			isRegistered: boolean( 'Is Registered?', false ),
			isUserConnected: boolean( 'Is User Connected?', false ),
		},
		connectionStatusIsFetching: boolean( 'Is Fetching Connect Status?', false ),
		isRegistering: boolean( 'Is Registering?', false ),
		registationError: boolean( 'Registration Error?', false ),
	};

	return <ConnectButtonVisual { ...componentProps } />;
};

// Export additional stories using pre-defined values
const Template = args => <ConnectButtonVisual { ...args } />;

const DefaultArgs = {
	onButtonClick: () => {
		return;
	},
	connectionStatus: {
		isRegistered: false,
		isUserConnected: false,
	},
	connectionStatusIsFetching: false,
	isRegistering: false,
	registationError: false,
};

export const Registering = Template.bind( {} );
Registering.args = {
	...DefaultArgs,
	isRegistering: true,
};

export const Errored = Template.bind( {} );
Errored.args = {
	...DefaultArgs,
	registationError: true,
};

export const FetchingStatus = Template.bind( {} );
FetchingStatus.args = {
	...DefaultArgs,
	connectionStatusIsFetching: true,
};

export const SiteRegistered = Template.bind( {} );
SiteRegistered.args = {
	...DefaultArgs,
	connectionStatus: {
		isRegistered: true,
		isUserConnected: false,
	},
};

export const SiteRegisteredAndUserConnected = Template.bind( {} );
SiteRegisteredAndUserConnected.args = {
	...DefaultArgs,
	connectionStatus: {
		isRegistered: true,
		isUserConnected: true,
	},
};
