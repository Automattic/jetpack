import { ThemeProvider } from '@automattic/jetpack-components';
import React from 'react';

// import '@wordpress/components/build-style/style.css';

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
