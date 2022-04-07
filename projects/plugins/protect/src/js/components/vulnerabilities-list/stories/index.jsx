/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import VulnerabilitiesList from '..';

export default {
	title: 'Plugins/Protect/VulnerabilitiesList',
	component: VulnerabilitiesList,
};

const Template = args => <VulnerabilitiesList { ...args } />;
export const Default = Template.bind( {} );
Default.args = {
	title: 'Plugins',
	list: [
		{
			name: 'Jetpack Backup',
			version: '1.0.1',
			vulnerabilities: [
				{
					description: 'Vulnerability Number 1',
					fixedIn: '1.1.0',
				},
				{
					description: 'Vulnerability Number 2',
					fixedIn: '1.1.0',
				},
				{
					description: 'Vulnerability Number 3',
					fixedIn: '1.1.0',
				},
				{
					description: 'Vulnerability Number 4',
					fixedIn: '1.1.0',
				},
			],
		},
		{
			name: 'Jetpack Boost',
			version: '1.2.1',
			vulnerabilities: [
				{
					description: 'Vulnerability Number 1',
					fixedIn: '1.2.2',
				},
				{
					description: 'Vulnerability Number 2',
					fixedIn: '1.2.2',
				},
				{
					description: 'Vulnerability Number 3',
					fixedIn: '1.2.2',
				},
				{
					description: 'Vulnerability Number 4',
					fixedIn: '1.2.2',
				},
			],
		},
	],
};
