import { __ } from '@wordpress/i18n';
import { StarIcon, HeartIcon } from './icons';

/**
 * Default glyph definitions.
 * Each entry contains the character to display and the human-readable label used in the styles picker.
 *
 * @type {Object<string, { char: string, label: string }>}
 */
export const DEFAULT_GLYPHS = {
	stars: {
		char: StarIcon,
		label: __( 'Stars', 'jetpack-forms' ),
	},
	hearts: {
		char: HeartIcon,
		label: __( 'Hearts', 'jetpack-forms' ),
	},
};
