import { __ } from '@wordpress/i18n';

export const PAID_PLUGIN_SUPPORT_URL = 'https://jetpack.com/contact-support/?rel=support';

export const HISTORIC_THREAT_STATUSES: { value: string; label: string; variant?: 'success' }[] = [
	{ value: 'fixed', label: __( 'Fixed', 'jetpack' ), variant: 'success' },
	{ value: 'ignored', label: __( 'Ignored', 'jetpack' ) },
];

export const THREAT_STATUSES: { value: string; label: string; variant?: 'success' | 'warning' }[] =
	[
		{ value: 'current', label: __( 'Active', 'jetpack' ), variant: 'warning' },
		...HISTORIC_THREAT_STATUSES,
	];

export const THREAT_TYPES = [
	{ value: 'plugin', label: __( 'Plugin', 'jetpack' ) },
	{ value: 'theme', label: __( 'Theme', 'jetpack' ) },
	{ value: 'core', label: __( 'WordPress', 'jetpack' ) },
	{ value: 'file', label: __( 'File', 'jetpack' ) },
	{ value: 'database', label: __( 'Database', 'jetpack' ) },
];
