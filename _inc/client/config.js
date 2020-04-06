const data = {
	i18n_default_locale_slug: 'en',
	mc_analytics_enabled: true,
	google_analytics_enabled: false,
	google_analytics_key: null,
};
function config( key ) {
	if ( key in data ) {
		return data[ key ];
	}
	throw new Error( 'config key `' + key + '` does not exist' );
}
export default config;
