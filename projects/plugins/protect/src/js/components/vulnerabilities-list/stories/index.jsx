import React from 'react';
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
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f416',
					title: 'Vulnerability Title 1',
					description: 'Vulnerability Description 1',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f417',
					title: 'Vulnerability Title 2',
					description: 'Vulnerability Description 2',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f418',
					title: 'Vulnerability Title 3',
					description: 'Vulnerability Description 3',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f410',
					title: 'Vulnerability Title 4',
					description: 'Vulnerability Description 4',
					fixedIn: '1.1.0',
				},
			],
		},
		{
			name: 'Jetpack Boost',
			version: '1.2.1',
			vulnerabilities: [
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f411',
					title: 'Vulnerability Title 1',
					description: 'Vulnerability Description 1',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f412',
					title: 'Vulnerability Title 2',
					description: 'Vulnerability Description 2',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f413',
					title: 'Vulnerability Title 3',
					description: 'Vulnerability Description 3',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f414',
					title: 'Vulnerability Title 4',
					description: 'Vulnerability Description 4',
					fixedIn: '1.2.2',
				},
			],
		},
	],
};
