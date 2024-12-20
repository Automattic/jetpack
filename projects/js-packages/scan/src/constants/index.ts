import {
	code as fileIcon,
	color as themeIcon,
	plugins as pluginIcon,
	shield as shieldIcon,
	wordpress as coreIcon,
} from '@wordpress/icons';

export const CONTACT_SUPPORT_URL = 'https://jetpack.com/contact-support/?rel=support';

/** Once a fixer has been running for this specified amount of time (in ms), it should be considered "stale". */
export const FIXER_IS_STALE_THRESHOLD = 1000 * 60 * 60 * 24; // 24 hours

export const THREAT_ICONS = {
	plugins: pluginIcon,
	themes: themeIcon,
	core: coreIcon,
	file: fileIcon,
	default: shieldIcon,
};
