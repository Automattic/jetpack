/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { DialogueIcon as icon } from '../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'dialogue';
export const title = __( 'Dialogue', 'jetpack' );
export const settings = {
	title,
	description: __( 'Dialogue', 'jetpack' ),
	icon,
	category: 'layout',
	supports: {
		'align': true,
	},
	edit,
	save,
	attributes,
	usesContext: [
		'jetpack/conversation-speakers',
		'jetpack/transcription-showtimestamp',
	],
};
