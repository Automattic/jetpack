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
import './extend';
import attributes from './attributes';
import edit from './edit';
import save from './save';
import example from './example';

export const name = 'conversation';
export const title = __( 'Conversation', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Create a transcription of a speech or conversation, with any number of participants, using dialogue blocks.',
		'jetpack'
	),
	icon,
	category: 'layout',
	keywords: [
		_x( 'Conversation', 'block search term', 'jetpack' ),
		__( 'transcription', 'jetpack' ),
	],
	supports: {
		align: true,
	},
	attributes,
	example,
	styles: [
		{ name: 'row', label: __( 'Row', 'jetpack' ), isDefault: true },
		{ name: 'column', label: __( 'Column', 'jetpack' ) },
	],
	edit,
	save,
	providesContext: {
		'jetpack/conversation-participants': 'participants',
		'jetpack/conversation-showTimestamps': 'showTimestamps',
	},
};
