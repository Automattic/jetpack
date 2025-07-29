import { __ } from '@wordpress/i18n';
import { StarIcon, HeartIcon } from './icons';

/**
 * Default glyph definitions.
 * Each entry contains the icon component to display and the human-readable label used in the styles picker.
 *
 * @type {Object<string, { icon: *, label: string }>}
 */
export const DEFAULT_GLYPHS = {
	stars: {
		icon: StarIcon,
		label: __( 'Stars', 'jetpack-forms' ),
	},
	hearts: {
		icon: HeartIcon,
		label: __( 'Hearts', 'jetpack-forms' ),
	},
};
