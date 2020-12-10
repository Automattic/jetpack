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
import { defaultParticipants } from '../conversation/edit';

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
	edit,
	save,
	attributes,
	usesContext: [ 'jetpack/conversation-participants', 'jetpack/conversation-showtimestamp' ],
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
