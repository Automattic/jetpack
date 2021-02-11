/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { TranscriptIcon as icon } from '../../shared/icons';

/**
 * Local dependencies
 */
import './extend';
import attributes from './attributes';
import edit from './edit';
import save from './save';
import example from './example';

export const name = 'transcript';
export const title = __( 'Transcript', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Create a transcription of a speech or conversation, with any number of participants, using dialogue blocks.',
		'jetpack'
	),
	icon,
	category: 'layout',
	keywords: [
		_x( 'conversation', 'block search term', 'jetpack' ),
		_x( 'transcription', 'block search term', 'jetpack' ),
		_x( 'dialogue', 'block search term', 'jetpack' ),
		_x( 'speaker', 'block search term', 'jetpack' ),
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
		'jetpack/transcript-participants': 'participants',
		'jetpack/transcript-showTimestamps': 'showTimestamps',
	},
};
