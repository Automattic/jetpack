/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { DialogueIcon as icon } from '../../shared/icons';
import { list as defaultParticipants } from '../conversation/participants.json';

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
	icon,
	category: 'layout',
	edit,
	save,
	attributes,
	usesContext: [ 'jetpack/conversation-participants', 'jetpack/conversation-showTimestamps' ],
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
