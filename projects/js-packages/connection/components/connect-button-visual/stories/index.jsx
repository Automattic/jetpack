/**
 * External dependencies
 */
import React from 'react';
import ConnectButtonVisual from '../index.jsx';

export default {
	title: 'Playground/Connect Button',
	component: ConnectButtonVisual,
};

// Export additional stories using pre-defined values
const Template = args => <ConnectButtonVisual { ...args } />;

const DefaultArgs = {
	onButtonClick: () => {
		return;
	},
	isRegistered: false,
	isUserConnected: false,
	connectionStatusIsFetching: false,
	isRegistering: false,
	registationError: false,
};

// Export Default story using knobs
export const _default = Template.bind( {} );
_default.args = DefaultArgs;

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
	sRegistered: true,
	isUserConnected: false,
};

export const SiteRegisteredAndUserConnected = Template.bind( {} );
SiteRegisteredAndUserConnected.args = {
	...DefaultArgs,
	isRegistered: true,
	isUserConnected: true,
};
