const WP_ADMIN_USER = {
	username: 'wordpress',
	password: 'wordpress',
};

const {
	WP_USERNAME = WP_ADMIN_USER.username,
	WP_PASSWORD = WP_ADMIN_USER.password,
	WP_BASE_URL = 'http://localhost',
} = process.env;

process.env = Object.assign( process.env, {
	WP_PASSWORD,
	WP_ADMIN_USER,
	WP_USERNAME,
	WP_BASE_URL,
} );

export { WP_PASSWORD, WP_ADMIN_USER, WP_USERNAME, WP_BASE_URL };
