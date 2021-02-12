/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { TranscriptDialogueIcon as icon } from '../../shared/icons';
import { list as defaultParticipants } from '../transcript/participants.json';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'dialogue';
export const title = __( 'Transcript Dialogue', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Create a dialogue paragraph, setting the participant with an optional timestamp.',
		'jetpack'
	),
	icon,
	category: 'layout',
	edit,
	save,
	attributes,
	usesContext: [ 'jetpack/transcript-participants', 'jetpack/transcript-showTimestamps' ],
	keywords: [
		_x( 'dialogue', 'block search term', 'jetpack' ),
		_x( 'participant', 'block search term', 'jetpack' ),
		_x( 'transcription', 'block search term', 'jetpack' ),
		_x( 'speaker', 'block search term', 'jetpack' ),
	],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				isMultiBlock: true,
				transform: blocks => {
					return blocks.map( ( { content } ) =>
						createBlock( 'jetpack/dialogue', {
							participant: defaultParticipants[ 0 ],
							content,
						} )
					);
				},
			},
		],
	},
};
