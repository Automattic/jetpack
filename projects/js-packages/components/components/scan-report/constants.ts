import { __ } from '@wordpress/i18n';
import {
	code as fileIcon,
	color as themeIcon,
	plugins as pluginIcon,
	shield as shieldIcon,
	wordpress as coreIcon,
} from '@wordpress/icons';

export const TYPES = [
	{ value: 'core', label: __( 'WordPress', 'jetpack-components' ) },
	{ value: 'plugins', label: __( 'Plugin', 'jetpack-components' ) },
	{ value: 'themes', label: __( 'Theme', 'jetpack-components' ) },
	{ value: 'files', label: __( 'Files', 'jetpack-components' ) },
];

export const ICONS = {
	plugins: pluginIcon,
	themes: themeIcon,
	core: coreIcon,
	files: fileIcon,
	default: shieldIcon,
};

export const FIELD_ICON = 'icon';
export const FIELD_TYPE = 'type';
export const FIELD_NAME = 'name';
export const FIELD_STATUS = 'status';
export const FIELD_UPDATE = 'update';
export const FIELD_VERSION = 'version';
