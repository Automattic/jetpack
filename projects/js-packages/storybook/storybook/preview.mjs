import { ThemeProvider } from '@automattic/jetpack-components';
import React from 'react';

/* eslint-disable no-restricted-syntax */
// import '@wordpress/components/build-style/style.css';
/* eslint-enable no-restricted-syntax */

import './style.scss';

window.wp = {
	i18n: {},
};

const preview = {
	parameters: {
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
	},
	decorators: [
		Story => (
			<ThemeProvider id="storybook-stories" targetDom={ document.body }>
				<Story />
			</ThemeProvider>
		),
	],
};
export default preview;
