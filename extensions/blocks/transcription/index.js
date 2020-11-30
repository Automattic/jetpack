/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ConversationIcon as icon } from '../../shared/icons';

/**
 * Local dependencies
 */
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
	icon,
	category: 'layout',
	keywords: [
		_x( 'Transcription', 'block search term', 'jetpack' ),
		__( 'Conversation', 'jetpack' ),
	],
	supports: {
		'align': true,
	},
	attributes,
	styles: [
		{ name: 'row', label: __( 'Row', 'jetpack' ), isDefault: true },
		{ name: 'column', label: __( 'Column', 'jetpack' ) },
	],
	edit,
	save,
	providesContext: {
		'jetpack/conversation-speakers': 'speakers',
		'jetpack/transcription-showtimestamp': 'showTimeStamp',
	},
};
