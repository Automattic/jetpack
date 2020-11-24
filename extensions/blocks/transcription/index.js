/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import save from './save';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'transcription';
export const title = __( 'Transcription', 'jetpack' );
export const settings = {
	title,
	description: __( 'Transcription', 'jetpack' ),
	icon: {
		src: 'text',
		foreground: getIconColor(),
	},
	category: 'layout',
	keywords: [
		_x( 'Transcription', 'block search term', 'jetpack' ),
	],
	supports: {
		'align': true,
	},
	attributes,
	edit,
	save,
	providesContext: {
		'dialogue/labels': 'labels',
	},
};
