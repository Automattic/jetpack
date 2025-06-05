import React from 'react';
import ManageConnectionDialog from '..';

export default {
	title: 'JS Packages/Connection/Manage Connection Dialog',
	component: ManageConnectionDialog,
	decorators: [
		( Story, context ) => {
			// Mock JetpackScriptData for WoA detection
			window.JetpackScriptData = {
				...( window.JetpackScriptData || {} ),
				site: {
					...( window.JetpackScriptData?.site || {} ),
					host: context.args.siteHost || 'standard',
				},
			};
			return <Story />;
		},
	],
};

const Template = args => <ManageConnectionDialog { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	isOpen: true,
	apiNonce: 'test',
	apiRoot: 'https://example.org/wp-json/',
	title: 'Manage your Jetpack connection',
	connectedUser: {
		currentUser: {
			permissions: {
				manage_options: true,
			},
			isConnected: true,
			isMaster: false,
		},
	},
};

export const WoASite = Template.bind( {} );
WoASite.args = {
	..._default.args,
	siteHost: 'woa', // This will set the mock to WoA site
};
WoASite.storyName = 'WoA Site (Disconnect Hidden)';
WoASite.parameters = {
	docs: {
		description: {
			story:
				'On WoA sites, the "Disconnect Jetpack" option is hidden for all users to prevent accidental disconnection.',
		},
	},
};
