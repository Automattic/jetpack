/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blocksStore, createBlock, type BlockInstance } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	ApplyBlockEditsArgs,
	ApplyBlockEditsResult,
	BlockData,
	BlockEditResults,
	BlockInsertion,
	BlockUpdate,
	UseApplyBlockEditsReturn,
} from '../types';
import {
	compareBlockStates,
	deepMerge,
	mergeBlocksRecursively,
	validateEditResults,
} from '../utils/block-utils';
import { BLOCK_CSS_CLASSES, BLOCK_EDITOR, TOOL_MESSAGES } from '../constants';

/**
 * Hook that provides block editing functionality.
 *
 * @return Block editing functions and state
 */
export default function useApplyBlockEdits(): UseApplyBlockEditsReturn {
	const [ isProcessing, setIsProcessing ] = useState( false );

	// Get available block types
	const blockTypes = useSelect( select => {
		const store = select( blocksStore );
		return store?.getBlockTypes ? store.getBlockTypes() : [];
	}, [] );

	const availableBlocks = useMemo(
		() => ( Array.isArray( blockTypes ) ? blockTypes.map( ( block: any ) => block.name ) : [] ),
		[ blockTypes ]
	);

	// Get block editor selectors
	const { getBlock, getBlockParents, getBlocks } = useSelect( select => {
		const store = select( blockEditorStore ) as any;
		return {
			getBlock: store?.getBlock || ( ( clientId: string ) => null ),
			getBlockParents: store?.getBlockParents || ( ( clientId: string ) => [] ),
			getBlocks: store?.getBlocks || ( () => [] ),
		};
	}, [] );

	// Get block editor actions
	const { replaceBlock, insertBlock, removeBlock } = useDispatch( blockEditorStore );

	/**
	 * Creates a block and its inner blocks recursively
	 *
	 * @param blockData - Block data including name, attributes, and innerBlocks
	 * @return A valid block with all inner blocks properly created
	 */
	const createBlockRecursively = useCallback(
		async ( blockData: BlockData ): Promise< BlockInstance > => {
			// Create inner blocks first if they exist
			const processedInnerBlocks = blockData.innerBlocks?.length
				? await Promise.all( blockData.innerBlocks.map( createBlockRecursively ) )
				: [];

			// Create the block
			const block = createBlock( blockData.name, blockData.attributes || {}, processedInnerBlocks );

			// Add processing class if needed
			if ( blockData.attributes?.isProcessing ) {
				block.attributes.className = `${ block.attributes.className || '' } ${
					BLOCK_CSS_CLASSES.PROCESSING
				}`.trim();
			}

			return block;
		},
		[]
	);

	/**
	 * Deletes blocks based on their clientIds
	 *
	 * @param clientIds  - Array of compressed clientIds to delete
	 * @param reverseMap - Mapping of compressed to original IDs
	 */
	const deleteBlocks = useCallback(
		async ( clientIds: string[], reverseMap: Record< string, string > ) => {
			if ( ! clientIds?.length ) {
				return;
			}

			for ( const clientId of clientIds ) {
				const originalClientId = reverseMap[ clientId ];

				if ( ! originalClientId ) {
					console.error(
						`[Agenttic] Could not map compressed clientId for deletion: ${ clientId }`,
						'Available mappings:',
						reverseMap
					);
					continue;
				}

				const targetBlock = getBlock( originalClientId );

				if ( ! targetBlock ) {
					console.error(
						`[Agenttic] Block not found for deletion with clientId: ${ originalClientId }`
					);
					continue;
				}

				// Delete the block
				removeBlock( originalClientId );
			}
		},
		[ getBlock, removeBlock ]
	);

	/**
	 * Applies the edit results to the blocks
	 *
	 * @param editResults - The edit results to apply
	 * @param reverseMap  - Mapping of compressed to original IDs
	 */
	const applyEdits = useCallback(
		async ( editResults: BlockEditResults, reverseMap: Record< string, string > ) => {
			// Handle insertions first to avoid clientId conflicts
			if ( editResults.inserts?.length ) {
				for ( const insert of editResults.inserts ) {
					const { parentClientId, index = 0, block } = insert;

					// If no parentClientId is provided, get the first root block
					let originalParentClientId = parentClientId ? reverseMap[ parentClientId ] : undefined;

					if ( ! originalParentClientId ) {
						// Try to get the post content block or first available parent
						const blocks = getBlocks();
						if ( blocks.length > 0 ) {
							originalParentClientId = blocks[ 0 ].clientId;
						}
					}

					if ( ! originalParentClientId ) {
						console.error(
							`[Agenttic] Could not determine parent for insertion`,
							'Parent ID:',
							parentClientId,
							'Available mappings:',
							reverseMap
						);
						continue;
					}

					const parentBlock = getBlock( originalParentClientId );

					if ( ! parentBlock ) {
						console.error(
							`[Agenttic] Parent block not found with clientId: ${ originalParentClientId }`
						);
						continue;
					}

					// Create a valid block with proper validation
					const validBlock = await createBlockRecursively( block );
					insertBlock( validBlock, index, originalParentClientId );
				}
			}

			// Handle updates
			if ( editResults.updates?.length ) {
				// Sort updates by depth (inner blocks first)
				const clientIdDepth = new Map< string, number >();
				for ( const update of editResults.updates ) {
					const { clientId } = update;
					const originalClientId = reverseMap[ clientId ];
					const depth = originalClientId ? getBlockParents( originalClientId )?.length ?? 0 : 0;
					clientIdDepth.set( clientId, depth );
				}

				const updates = [ ...editResults.updates ].sort(
					( a, b ) =>
						( clientIdDepth.get( b.clientId ) || 0 ) - ( clientIdDepth.get( a.clientId ) || 0 )
				);

				for ( const update of updates ) {
					const { clientId, ...blockData } = update;
					const originalClientId = reverseMap[ clientId ];

					if ( ! originalClientId ) {
						console.error(
							`[Agenttic] Could not map compressed clientId: ${ clientId }`,
							'Available mappings:',
							reverseMap
						);
						continue;
					}

					const targetBlock = getBlock( originalClientId );

					if ( ! targetBlock ) {
						console.error( `[Agenttic] Block not found with clientId: ${ originalClientId }` );
						continue;
					}

					// Convert targetBlock to BlockData format
					const targetBlockData: BlockData = {
						name: targetBlock.name,
						clientId: targetBlock.clientId,
						attributes: targetBlock.attributes,
						innerBlocks: targetBlock.innerBlocks?.map( ( ib: BlockInstance ) => ( {
							name: ib.name,
							clientId: ib.clientId,
							attributes: ib.attributes,
							innerBlocks: [], // Simplified for now
						} ) ),
					};

					// Recursively merge block data to preserve properties at all levels
					const mergedBlockData = mergeBlocksRecursively(
						targetBlockData,
						blockData as BlockData,
						reverseMap
					);

					// Create a valid block with proper validation
					const validBlock = await createBlockRecursively( mergedBlockData );
					replaceBlock( originalClientId, validBlock );

					// Update the reverseMap with the new clientId
					reverseMap[ clientId ] = validBlock.clientId;
				}
			}

			// Handle deletions
			if ( editResults.deletes?.length ) {
				await deleteBlocks( editResults.deletes, reverseMap );
			}
		},
		[
			createBlockRecursively,
			deleteBlocks,
			getBlock,
			getBlockParents,
			getBlocks,
			insertBlock,
			replaceBlock,
		]
	);

	/**
	 * Applies edits to existing blocks.
	 *
	 * @param args - The arguments for the tool.
	 * @return The edit results.
	 */
	const applyBlockEdits = useCallback(
		async ( args: ApplyBlockEditsArgs ): Promise< ApplyBlockEditsResult > => {
			const { updates, inserts, deletes, reverseMap, summary, followUpTasks } = args;

			setIsProcessing( true );

			try {
				const editResults: BlockEditResults = { updates, inserts, deletes };

				// Get current block state before edits
				const blocksBeforeEdit = getBlocks().map( ( block: BlockInstance ) => ( {
					name: block.name,
					clientId: block.clientId,
					attributes: block.attributes,
				} ) );

				// Validate the edit results
				validateEditResults( editResults, availableBlocks );

				// Apply the edits
				await applyEdits( editResults, reverseMap );

				// Get block state after edits
				const blocksAfterEdit = getBlocks().map( ( block: BlockInstance ) => ( {
					name: block.name,
					clientId: block.clientId,
					attributes: block.attributes,
				} ) );

				// Check if any edits were actually made
				if ( JSON.stringify( blocksBeforeEdit ) === JSON.stringify( blocksAfterEdit ) ) {
					setIsProcessing( false );
					return {
						result: TOOL_MESSAGES.NO_CHANGES,
						returnToAgent: followUpTasks,
					};
				}

				// Log the differences for debugging
				const differences = compareBlockStates( blocksBeforeEdit, blocksAfterEdit );
				console.log( '[Agenttic] Block changes:', differences );

				setIsProcessing( false );

				// Return the result
				return {
					result: summary || TOOL_MESSAGES.EDITS_COMPLETED,
					returnToAgent: followUpTasks,
				};
			} catch ( error ) {
				console.error( '[Agenttic] Error applying block edits:', error );
				setIsProcessing( false );

				return {
					result: error instanceof Error ? error.message : TOOL_MESSAGES.UNKNOWN_ERROR,
					returnToAgent: followUpTasks,
				};
			}
		},
		[ applyEdits, availableBlocks, getBlocks, validateEditResults ]
	);

	return {
		applyBlockEdits,
		isProcessing,
	};
}
