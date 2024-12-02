import { __ } from '@wordpress/i18n';
import {
	code as fileIcon,
	color as themeIcon,
	plugins as pluginIcon,
	shield as shieldIcon,
	wordpress as coreIcon,
} from '@wordpress/icons';

export const THREAT_TYPES = [
	{ value: 'plugins', label: __( 'Plugins', 'jetpack' ) },
	{ value: 'themes', label: __( 'Themes', 'jetpack' ) },
	{ value: 'core', label: __( 'WordPress', 'jetpack' ) },
	{ value: 'file', label: __( 'File', 'jetpack' ) },
];

export const THREAT_ICONS = {
	plugins: pluginIcon,
	themes: themeIcon,
	core: coreIcon,
	file: fileIcon,
	default: shieldIcon,
};

export const THREAT_FIELD_ICON = 'icon';
export const THREAT_FIELD_TYPE = 'type';
export const THREAT_FIELD_EXTENSION = 'extension';
export const THREAT_FIELD_SAFETY = 'safety';
export const THREAT_FIELD_UPDATE = 'update';
export const THREAT_FIELD_VERSION = 'version';
