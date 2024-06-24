/*
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
/*
 * Internal dependencies
 */
import { ALL_EXTENDED_BLOCKS } from '../../extensions/ai-assistant';
import { getStoreBlockId } from '../../extensions/ai-assistant/with-ai-assistant';
import { getBlocksContent } from '../../lib/utils/block-content';
import { transformToAIAssistantBlock } from '../../transforms';
/*
 * Types
 */
import type { AiAssistantDropdownOnChangeOptionsArgProps } from '../../components/ai-assistant-toolbar-dropdown/dropdown-content';
import type { PromptTypeProp } from '../../lib/prompt';
import type { Block } from '@automattic/jetpack-ai-client';

type CoreBlockEditorDispatch = {
	insertBlock: ( block: Block ) => void;
	removeBlocks: ( clientIds: string[] ) => void;
	replaceBlock: ( clientId: string, block: Block ) => void;
};

type CoreBlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
	getSelectedBlockClientIds: () => string[];
	getBlocksByClientId: ( clientIds: string[] ) => Block[];
	getBlockParents: ( clientId: string ) => string[];
};

const useTransformToAssistant = () => {
	const { replaceBlock, removeBlocks } = useDispatch(
		'core/block-editor'
	) as CoreBlockEditorDispatch;
	const blockEditorSelect: CoreBlockEditorSelect = useSelect(
		select => select( 'core/block-editor' ),
		[]
	);
	const { getSelectedBlockClientIds, getBlocksByClientId, getBlock, getBlockParents } =
		blockEditorSelect;

	const { tracks } = useAnalytics();

	const canTransformToAIAssistant = useCallback(
		( { clientId, blockName }: { clientId: string; blockName: string } ) => {
			const block = getBlock( clientId );

			// The block must exist
			if ( ! block ) {
				return false;
			}

			// The block must be an extended block
			if ( ! ALL_EXTENDED_BLOCKS.includes( blockName ) ) {
				return false;
			}

			// Checks if the block's parent is a list-item or list block, in which case a transformation is not allowed
			const blockParents = getBlockParents( clientId );

			if ( blockParents.length === 0 ) {
				return true;
			}

			// The block parents array is ordered from the root block to the closest parent
			const parentBlock = getBlock( blockParents[ blockParents.length - 1 ] );
			const isInsideList = [ 'core/list', 'core/list-item' ].includes( parentBlock.name as string );

			return ! isInsideList;
		},
		[ getBlock, getBlockParents ]
	);

	const transformToAIAssistant = useCallback(
		( {
			request,
		}: {
			request?: {
				promptType: PromptTypeProp;
				options?: AiAssistantDropdownOnChangeOptionsArgProps;
			};
		} = {} ) => {
			const selectedBlockIds = getSelectedBlockClientIds();
			const selectedBlocks = getBlocksByClientId( selectedBlockIds );

			const content = getBlocksContent( selectedBlocks );

			const [ firstBlock ] = selectedBlocks;
			const [ firstClientId, ...otherBlocksIds ] = selectedBlockIds;

			const extendedBlockAttributes = {
				...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
				content,
			};

			const newAIAssistantBlock = transformToAIAssistantBlock(
				firstBlock.name as string,
				extendedBlockAttributes
			);

			// Store the client id of the block that needs to auto-trigger the AI Assistant request
			if ( request?.promptType ) {
				tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
					suggestion: request.promptType,
					block_type: firstBlock.name as string,
				} );

				// Store client id, prompt type, and options.
				const storeObject = {
					clientId: firstClientId,
					type: request.promptType,
					// When converted, the original content must be treated as generated
					options: { ...request.options, contentType: 'generated', fromExtension: true },
				};

				localStorage.setItem(
					getStoreBlockId( newAIAssistantBlock.clientId ),
					JSON.stringify( storeObject )
				);
			} else {
				tracks.recordEvent( 'jetpack_ai_assistant_prompt_show', {
					block_type: firstBlock.name as string,
				} );
			}

			replaceBlock( firstClientId, newAIAssistantBlock );
			removeBlocks( otherBlocksIds );
		},
		[ getBlocksByClientId, getSelectedBlockClientIds, removeBlocks, replaceBlock, tracks ]
	);

	return {
		canTransformToAIAssistant,
		transformToAIAssistant,
		getSelectedBlockClientIds,
	};
};

export default useTransformToAssistant;
