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
};

// Export additional stories using pre-defined values
const Template = ( { buttonLabel, displayError, isLoading, ...props } ) => (
	<ConnectScreenVisual { ...props }>
		<p>Secure and speed up your site for free with Jetpack's powerful WordPress tools</p>

		<ul>
			<li>Measure your impact with beautiful stats</li>
			<li>Speed up your site with optimized images</li>
			<li>Protect your site against bot attacks</li>
			<li>Get notifications if your site goes offline</li>
			<li>Enhance your site with dozens of other features</li>
		</ul>

		<ActionButton
			label={ buttonLabel }
			onClick={ action( 'onButtonClick' ) }
			displayError={ displayError }
			isLoading={ isLoading }
		/>
	</ConnectScreenVisual>
);

const DefaultArgs = {
	// action button props
	isLoading: false,
	buttonLabel: 'Set up Jetpack',
	displayError: false,
	// connect screen props
	title: 'Over 5 million WordPress sites are faster and more secure',
	assetBaseUrl: '/',
	images: [ 'connect-right.png' ],
};

export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const Connecting = Template.bind( {} );
Connecting.args = {
	...DefaultArgs,
	isLoading: true,
};

export const Errored = Template.bind( {} );
Errored.args = {
	...DefaultArgs,
	displayError: true,
};
