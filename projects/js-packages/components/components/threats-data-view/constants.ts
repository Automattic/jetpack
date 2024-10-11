import { __ } from '@wordpress/i18n';

export const PAID_PLUGIN_SUPPORT_URL = 'https://jetpack.com/contact-support/?rel=support';

export const THREAT_STATUSES = [
	{ value: 'current', label: __( 'Active', 'jetpack' ) },
	{ value: 'fixed', label: __( 'Fixed', 'jetpack' ) },
	{ value: 'ignored', label: __( 'Ignored', 'jetpack' ) },
];

export const THREAT_TYPES = [
	{ value: 'plugin', label: __( 'Plugin', 'jetpack' ) },
	{ value: 'theme', label: __( 'Theme', 'jetpack' ) },
	{ value: 'core', label: __( 'WordPress', 'jetpack' ) },
	{ value: 'file', label: __( 'File', 'jetpack' ) },
	{ value: 'database', label: __( 'Database', 'jetpack' ) },
];
