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
import { TranscriptSpeakerIcon as icon } from '../../shared/icons';
import participants from '../conversation/participants.json';
const defaultParticipants = participants.list;

import { name as parentName } from '../conversation/index';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'dialogue';
export const title = __( 'Dialogue', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Create a dialogue paragraph, setting the participant with an optional timestamp.',
		'jetpack'
	),
	parent: [ `jetpack/${ parentName }` ],
	icon,
	category: 'layout',
	edit,
	save,
	attributes,
	usesContext: [ 'jetpack/conversation-participants', 'jetpack/conversation-showTimestamps' ],
	keywords: [
		_x( 'dialogue', 'block search term', 'jetpack' ),
		_x( 'participant', 'block search term', 'jetpack' ),
		_x( 'transcription', 'block search term', 'jetpack' ),
		_x( 'speaker', 'block search term', 'jetpack' ),
	],
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				isMultiBlock: true,
				transform: blocks => {
					return blocks.map( ( { content, label } ) =>
						createBlock( 'core/paragraph', {
							content: ( label?.length ? `<strong>${ label }</strong>: ` : '' ) + content,
						} )
					);
				},
			},
		],
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
