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

export const name = 'conversation';
export const title = __( 'Conversation', 'jetpack' );
export const settings = {
	title,
	description: __( 'Conversation', 'jetpack' ),
	icon,
	category: 'layout',
	keywords: [
		_x( 'Conversation', 'block search term', 'jetpack' ),
		__( 'transcription', 'jetpack' ),
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
		'jetpack/conversation-showtimestamp': 'showTimeStamp',
	},
};
