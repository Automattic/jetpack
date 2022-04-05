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
					risk: 'low',
					description: 'Vulnerability Number 1',
				},
				{
					risk: 'high',
					description: 'Vulnerability Number 2',
				},
				{
					risk: 'medium',
					description: 'Vulnerability Number 3',
				},
				{
					risk: 'low',
					description: 'Vulnerability Number 4',
				},
			],
		},
		{
			name: 'Jetpack Boost',
			version: '1.2.1',
			vulnerabilities: [
				{
					risk: 'high',
					description: 'Vulnerability Number 1',
				},
				{
					risk: 'low',
					description: 'Vulnerability Number 2',
				},
				{
					risk: 'medium',
					description: 'Vulnerability Number 3',
				},
				{
					risk: 'low',
					description: 'Vulnerability Number 4',
				},
			],
		},
	],
};
