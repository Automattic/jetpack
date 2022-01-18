/**
 * External dependencies
 */
import React from 'react';
import { ThemeProvider } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import VarsComponent from '../';

export default {
	title: 'My Jetpack/Theme POC',
	component: VarsComponent,
	decorators: [
		Story => (
			<ThemeProvider>
				<Story />
			</ThemeProvider>
		),
	],
};

const Template = () => <VarsComponent />;
export const Default = Template.bind( {} );
