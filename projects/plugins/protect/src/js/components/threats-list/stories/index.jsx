import React from 'react';
import ThreatsList from '..';

export default {
	title: 'Plugins/Protect/ThreatsList',
	component: ThreatsList,
};

const Template = args => <ThreatsList { ...args } />;
export const Default = Template.bind( {} );
Default.args = {
	title: 'Plugins',
	list: [
		{
			name: 'Jetpack Backup',
			version: '1.0.1',
			threats: [
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f416',
					title: 'Threat Title 1',
					description: 'Threat Description 1',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f417',
					title: 'Threat Title 2',
					description: 'Threat Description 2',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f418',
					title: 'Threat Title 3',
					description: 'Threat Description 3',
					fixedIn: '1.1.0',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f410',
					title: 'Threat Title 4',
					description: 'Threat Description 4',
					fixedIn: '1.1.0',
				},
			],
		},
		{
			name: 'Jetpack Boost',
			version: '1.2.1',
			threats: [
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f411',
					title: 'Threat Title 1',
					description: 'Threat Description 1',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f412',
					title: 'Threat Title 2',
					description: 'Threat Description 2',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f413',
					title: 'Threat Title 3',
					description: 'Threat Description 3',
					fixedIn: '1.2.2',
				},
				{
					id: '1fd6742e-1a32-446d-be3d-7cce44f8f414',
					title: 'Threat Title 4',
					description: 'Threat Description 4',
					fixedIn: '1.2.2',
				},
			],
		},
	],
};
