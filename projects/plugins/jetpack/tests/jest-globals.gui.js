import jQuery from 'jquery';

// Normally supplied as a global by WordPress.
global.jQuery = jQuery;

// Mock this that's usually set from PHP Jetpack_React_Page::page_admin_scripts().
window.Initial_State = {
	userData: {},
	dismissedNotices: {},
	locale: '{}',
	licensing: { error: '' },
};

// And this from automattic/jetpack-connection.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacrmaneto' },
		},
	},
};
