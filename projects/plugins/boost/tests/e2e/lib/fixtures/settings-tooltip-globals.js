/* global window */
// Must run before the data-sync and My Jetpack clients are evaluated, so it is the entry's first import.
window.Jetpack_Boost = { site: { online: true, url: 'http://boost-settings.test' } };
window.jetpack_boost_ds = {
	rest_api: { value: 'http://boost-settings.test/wp-json', nonce: 'fixture' },
	premium_features: { value: [], nonce: 'fixture' },
	page_cache: { value: { bypass_patterns: [], logging: false }, nonce: 'fixture' },
};
window.myJetpackInitialState = { myJetpackUrl: '', products: { items: {} }, siteSuffix: '' };
window.myJetpackRest = { apiRoot: 'http://boost-settings.test/wp-json/', apiNonce: 'fixture' };
window.JP_CONNECTION_INITIAL_STATE = {
	apiRoot: 'http://boost-settings.test/wp-json/',
	apiNonce: 'fixture',
	registrationNonce: 'fixture',
	connectionStatus: {},
};
