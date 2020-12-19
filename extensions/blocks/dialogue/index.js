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
	description: __( 'Create a dialogue paragraph, setting the participant with an optional timestamp.', 'jetpack' ),
	icon,
	category: 'layout',
	edit,
	save: () => null,
	attributes,
	usesContext: [ 'jetpack/conversation-participants', 'jetpack/conversation-showTimestamps' ],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'jetpack/dialogue', {
						...defaultParticipants[ 0 ],
						content,
					} );
				},
			},
		],
	},
};
