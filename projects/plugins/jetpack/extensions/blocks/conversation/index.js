/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { TranscriptIcon as icon } from '../../shared/icons';
import { pickExtensionFromFileName } from '../../shared/file-utils';
import createBlocksFromInnerBlocksTemplate from '../../shared/create-block-from-inner-blocks-template';
import {
	isAcceptedTranscriptExtension,
	parseTranscriptFile,
	FILE_EXTENSION_TXT,
} from '../../shared/transcript-utils';

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
			{
				type: 'files',
				isMatch: async function ( files ) {
					if ( files.length !== 1 ) {
						return false;
					}

					const file = files[ 0 ];
					const fileExtension = pickExtensionFromFileName( file.name );
					if ( ! fileExtension ) {
						return false;
					}

					if (
						fileExtension !== FILE_EXTENSION_TXT &&
						isAcceptedTranscriptExtension( fileExtension )
					) {
						return true;
					}

					if ( ! file?.type?.length || file.type !== 'text/plain' ) {
						return false;
					}

					return true;
				},
				priority: 15,
				transform: ( files ) => {
					const conversationBlock = createBlock( 'jetpack/conversation', {
						createdFromScratch: true,
					} );

					const file = files[ 0 ];
					// Async process:
					// Populate the conversation block with children Dialogue blocks.
					parseTranscriptFile( file, function( parsedData ) {
						const { insertBlocks } = dispatch( 'core/block-editor' );
						const { updateBlockAttributes } = dispatch( 'core/editor' );

						updateBlockAttributes(
							conversationBlock.clientId, {
								participants: parsedData.conversation.speakers,
							}
						);

						const dialogueBlocksTemplate = parsedData.dialogues.map( ( dialogue ) => [
							'jetpack/dialogue',
							{ ...dialogue },
						] );

						const dialogueBlocks = createBlocksFromInnerBlocksTemplate( dialogueBlocksTemplate );
						insertBlocks( dialogueBlocks, 0, conversationBlock.clientId );
					} );

					return conversationBlock;
				},
			},
		],
	},
};
