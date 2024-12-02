import { __ } from '@wordpress/i18n';
import {
	code as fileIcon,
	color as themeIcon,
	plugins as pluginIcon,
	shield as shieldIcon,
	wordpress as coreIcon,
} from '@wordpress/icons';

export const THREAT_STATUSES: { value: string; label: string; variant?: 'success' | 'warning' }[] =
	[
		{ value: 'current', label: __( 'Active', 'jetpack-components' ), variant: 'warning' },
		{ value: 'fixed', label: __( 'Fixed', 'jetpack-components' ), variant: 'success' },
		{ value: 'ignored', label: __( 'Ignored', 'jetpack-components' ) },
	];

export const THREAT_TYPES = [
	{ value: 'plugin', label: __( 'Plugin', 'jetpack-components' ) },
	{ value: 'theme', label: __( 'Theme', 'jetpack-components' ) },
	{ value: 'core', label: __( 'WordPress', 'jetpack-components' ) },
	{ value: 'file', label: __( 'File', 'jetpack-components' ) },
];

export const THREAT_ICONS = {
	plugin: pluginIcon,
	theme: themeIcon,
	core: coreIcon,
	file: fileIcon,
	default: shieldIcon,
};

export const THREAT_FIELD_THREAT = 'threat';
export const THREAT_FIELD_TITLE = 'title';
export const THREAT_FIELD_DESCRIPTION = 'description';
export const THREAT_FIELD_ICON = 'icon';
export const THREAT_FIELD_STATUS = 'status';
export const THREAT_FIELD_TYPE = 'type';
export const THREAT_FIELD_EXTENSION = 'extension';
export const THREAT_FIELD_PLUGIN = 'plugin';
export const THREAT_FIELD_THEME = 'theme';
export const THREAT_FIELD_SEVERITY = 'severity';
export const THREAT_FIELD_SIGNATURE = 'signature';
export const THREAT_FIELD_FIRST_DETECTED = 'first-detected';
export const THREAT_FIELD_FIXED_ON = 'fixed-on';
export const THREAT_FIELD_AUTO_FIX = 'auto-fix';

export const THREAT_ACTION_FIX = 'fix';
export const THREAT_ACTION_IGNORE = 'ignore';
export const THREAT_ACTION_UNIGNORE = 'unignore';
