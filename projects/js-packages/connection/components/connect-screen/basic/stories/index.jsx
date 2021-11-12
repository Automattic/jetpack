/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import { action } from '@storybook/addon-actions';
import { ActionButton } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectScreenVisual from '../visual';

export default {
	title: 'Connection/Connect Screen',
	component: ConnectScreenVisual,
	argTypes: {
		// renderConnectBtn is the property we want to remove from the UI
		renderConnectBtn: {
			table: {
				disable: true,
			},
		},
	},
};

// Export additional stories using pre-defined values
const Template = args => (
	<ConnectScreenVisual { ...args }>
		<p>Secure and speed up your site for free with Jetpack's powerful WordPress tools</p>

		<ul>
			<li>Measure your impact with beautiful stats</li>
			<li>Speed up your site with optimized images</li>
			<li>Protect your site against bot attacks</li>
			<li>Get notifications if your site goes offline</li>
			<li>Enhance your site with dozens of other features</li>
		</ul>
	</ConnectScreenVisual>
);

const DefaultArgs = {
	title: 'Over 5 million WordPress sites are faster and more secure',
	isLoading: false,
	buttonLabel: 'Set up Jetpack',
	assetBaseUrl: '/',
	images: [ 'connect-right.png' ],
	renderConnectBtn: ( label, autoTrigger ) => (
		<ActionButton
			label={ label }
			onClick={ action( 'onButtonClick' ) }
			displayError={ false }
			isLoading={ autoTrigger }
		/>
	),
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const Connecting = Template.bind( {} );
Connecting.args = {
	...DefaultArgs,
	renderConnectBtn: label => (
		<ActionButton
			label={ label }
			onClick={ action( 'onButtonClick' ) }
			displayError={ false }
			isLoading={ true }
		/>
	),
};

export const Errored = Template.bind( {} );
Errored.args = {
	...DefaultArgs,
	renderConnectBtn: label => (
		<ActionButton
			label={ label }
			onClick={ action( 'onButtonClick' ) }
			displayError={ true }
			isLoading={ false }
		/>
	),
};
