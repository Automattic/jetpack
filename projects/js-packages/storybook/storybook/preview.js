/**
 * External dependencies
 */
import React from 'react';
import { addDecorator } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { ThemeProvider } from '@automattic/jetpack-components';

/**
 * WordPress dependencies
 */
/* eslint-disable no-restricted-syntax */
// import '@wordpress/components/build-style/style.css';
/* eslint-enable no-restricted-syntax */

/**
 * Internal dependencies
 */
import './style.scss';

addDecorator( withA11y );

export const parameters = {
	backgrounds: {
		default: 'Jetpack Dashboard',
		values: [
			{
				name: 'Jetpack Dashboard',
				value: 'var(--jp-white-off)',
			},
			{
				name: 'Dark',
				value: 'rgb(51, 51, 51)',
			},
			{
				name: 'Light',
				value: '#FFF',
			},
		],
	},
};

export const decorators = [
	Story => (
		<ThemeProvider id="storybook-stories" targetDom={ document.body }>
			<Story />
		</ThemeProvider>
	),
];
