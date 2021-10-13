/**
 * External dependencies
 */
import React from 'react';
import ConnectButtonVisual from '../index.jsx';
import { action } from '@storybook/addon-actions';

export default {
	title: 'Playground/Connect Button',
	component: ConnectButtonVisual,
	// TODO: actinos are not working. See https://github.com/storybookjs/storybook/issues/7215
	argTypes: {
		onButtonClick: { action: 'clicked' },
	},
};

// Export additional stories using pre-defined values
const Template = args => <ConnectButtonVisual { ...args } />;

const DefaultArgs = {
	onButtonClick: action( 'onButtonClick' ),
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
