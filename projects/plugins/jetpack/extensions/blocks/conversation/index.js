/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { TranscriptIcon as icon } from '../../shared/icons';
import createBlocksFromInnerBlocksTemplate from '../../shared/create-block-from-inner-blocks-template';

/**
 * Local dependencies
 */
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
		'jetpack/conversation-participants': 'participants',
		'jetpack/conversation-showTimestamps': 'showTimestamps',
	},
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				isMultiBlock: true,
				transform: ( blocks ) => {
					const innerBlocksTemplate = blocks.map( ( { content } ) => [
							'jetpack/dialogue',
							{ content },
					] );

					return createBlock(
						'jetpack/conversation',
						{},
						createBlocksFromInnerBlocksTemplate( innerBlocksTemplate )
					);
				},
			},
		],
	},
};
