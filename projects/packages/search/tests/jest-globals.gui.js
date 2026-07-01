// @wordpress packages are webpack externals in some bundled dependencies (e.g.
// jetpack-boost-score-api). They resolve to window.wp.* at runtime, so jest
// needs the global to exist.
window.wp = window.wp || {};
window.wp.i18n = require( '@wordpress/i18n' );

window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacramento' },
		},
	},
};
