window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacrmaneto' },
		},
	},
};

window.jetpackSocialInitialState = {
	siteData: {
		apiRoot: true,
		apiNonce: true,
		registrationNonce: true,
		siteSuffix: true,
		pluginVersion: true,
	},
	jetpackSettings: { show_pricing_page: true },
};

// Overwrite window.location so assign can be stubbed.
const oldLocation = window.location;
delete window.location;
window.location = Object.defineProperties(
	{},
	{
		...Object.getOwnPropertyDescriptors( oldLocation ),
		assign: {
			configurable: true,
			writable: true,
			value: oldLocation.assign,
		},
		replace: {
			configurable: true,
			writable: true,
			value: oldLocation.replace,
		},
		reload: {
			configurable: true,
			writable: true,
			value: oldLocation.reload,
		},
	}
);
