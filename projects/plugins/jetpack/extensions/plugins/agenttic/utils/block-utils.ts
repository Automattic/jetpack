/**
 * Utility functions for block operations
 */

import type { BlockData, BlockDifference, BlockEditResults, BlockStateComparison } from '../types';

/**
 * Deep merge utility that recursively merges objects while preserving nested properties
 *
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @return The deeply merged result
 */
export function deepMerge< T = any >( target: T, source: any ): T {
	// Handle undefined case - keep target
	if ( source === undefined ) {
		return target;
	}

	// Handle null case - explicitly set to null (don't preserve target)
	if ( source === null ) {
		return null as T;
	}

	if ( target === null || target === undefined ) {
		return source;
	}

	// If source is not an object, replace target entirely
	if ( typeof source !== 'object' || Array.isArray( source ) ) {
		return source;
	}

	// If target is not an object, replace with source
	if ( typeof target !== 'object' || Array.isArray( target ) ) {
		return source;
	}

	// Both are objects - merge recursively
	const result: any = { ...target };

	for ( const key in source ) {
		if ( source.hasOwnProperty( key ) ) {
			const mergedValue = deepMerge( ( target as any )[ key ], source[ key ] );
			// Only include the property if the merged value is not null
			if ( mergedValue !== null ) {
				result[ key ] = mergedValue;
			} else {
				// Remove the property entirely if the merged value is null
				delete result[ key ];
			}
		}
	}

	return result;
}

/**
 * Validates the edit results structure
 *
 * @param results         - The edit results to validate
 * @param availableBlocks - The available block types
 * @throws Error if the results are invalid
 */
export function validateEditResults( results: BlockEditResults, availableBlocks: string[] ): void {
	if ( ! results.updates && ! results.inserts && ! results.deletes && ! results.summary ) {
		throw new Error(
			'Response must contain either updates, insertions, deletions, or a summary message'
		);
	}

	// Recursively validates that all blocks have valid names
	const validateBlockName = ( block: BlockData ): void => {
		if ( ! block.name && ! block.clientId ) {
			throw new Error( 'Block must have a name property' );
		}

		if ( ! availableBlocks.includes( block.name ) && ! block.clientId ) {
			throw new Error( `Block type "${ block.name }" is not available` );
		}

		// Recursively validate inner blocks
		if ( block.innerBlocks ) {
			for ( const innerBlock of block.innerBlocks ) {
				validateBlockName( innerBlock );
			}
		}
	};

	// Filter out null entries from updates, inserts, and deletes
	if ( results.updates ) {
		results.updates = results.updates.filter( Boolean );
	}
	if ( results.inserts ) {
		results.inserts = results.inserts.filter( Boolean );
	}
	if ( results.deletes ) {
		results.deletes = results.deletes.filter( Boolean );
	}

	// Transform deletes from objects to strings if needed
	if ( results.deletes && Array.isArray( results.deletes ) ) {
		results.deletes = results.deletes
			.map( ( item: any ) => ( typeof item === 'string' ? item : item?.clientId ) )
			.filter( Boolean );
	}

	// Validate updates
	if ( results.updates ) {
		for ( const update of results.updates ) {
			if ( ! update.clientId || ! update.name ) {
				throw new Error( 'Updates must contain clientId and name' );
			}
			validateBlockName( update );
		}
	}

	// Validate insertions
	if ( results.inserts ) {
		for ( const insert of results.inserts ) {
			if ( ! insert.block?.name ) {
				throw new Error( 'Insertions must contain block data with a name' );
			}
			validateBlockName( insert.block );
		}
	}

	// Validate deletions
	if ( results.deletes ) {
		if ( ! Array.isArray( results.deletes ) ) {
			throw new Error( 'Deletions must be an array of clientIds' );
		}

		for ( const clientId of results.deletes ) {
			if ( typeof clientId !== 'string' ) {
				throw new Error( 'Each deletion must be a clientId string' );
			}
		}
	}
}

/**
 * Compares two block states and returns the differences
 *
 * @param lastBlocks    - The previous state of blocks
 * @param currentBlocks - The current state of blocks
 * @return Object containing detailed differences
 */
export function compareBlockStates(
	lastBlocks: BlockData[],
	currentBlocks: BlockData[]
): BlockStateComparison {
	// Helper function to find differences between two objects
	const findDifferences = ( obj1: any, obj2: any, path = '' ): Record< string, any > => {
		const differences: Record< string, any > = {};

		// Get all unique keys from both objects
		const allKeys = new Set( [ ...Object.keys( obj1 || {} ), ...Object.keys( obj2 || {} ) ] );

		for ( const key of allKeys ) {
			const currentPath = path ? `${ path }.${ key }` : key;

			// If key exists in both objects
			if ( key in obj1 && key in obj2 ) {
				// If both values are objects (and not null), recursively compare them
				if (
					typeof obj1[ key ] === 'object' &&
					obj1[ key ] !== null &&
					typeof obj2[ key ] === 'object' &&
					obj2[ key ] !== null
				) {
					const nestedDifferences = findDifferences( obj1[ key ], obj2[ key ], currentPath );
					if ( Object.keys( nestedDifferences ).length > 0 ) {
						differences[ key ] = nestedDifferences;
					}
				}
				// If values are different, store both values
				else if ( JSON.stringify( obj1[ key ] ) !== JSON.stringify( obj2[ key ] ) ) {
					differences[ key ] = {
						from: obj1[ key ],
						to: obj2[ key ],
					};
				}
			}
			// If key only exists in first object
			else if ( key in obj1 ) {
				differences[ key ] = {
					from: obj1[ key ],
					to: undefined,
				};
			}
			// If key only exists in second object
			else if ( key in obj2 ) {
				differences[ key ] = {
					from: undefined,
					to: obj2[ key ],
				};
			}
		}

		return differences;
	};

	// Find added and removed blocks
	const added = currentBlocks.filter(
		block => ! lastBlocks.some( lastBlock => lastBlock.clientId === block.clientId )
	);

	const removed = lastBlocks.filter(
		block => ! currentBlocks.some( currentBlock => currentBlock.clientId === block.clientId )
	);

	// Find modified blocks and their specific changes
	const modified: BlockDifference[] = [];
	currentBlocks.forEach( currentBlock => {
		const lastBlock = lastBlocks.find( block => block.clientId === currentBlock.clientId );

		if ( lastBlock ) {
			const differences = findDifferences( lastBlock, currentBlock );
			if ( Object.keys( differences ).length > 0 ) {
				modified.push( {
					clientId: currentBlock.clientId!,
					name: currentBlock.name,
					changes: differences,
				} );
			}
		}
	} );

	return {
		added: added.map( block => ( {
			clientId: block.clientId!,
			name: block.name,
			attributes: block.attributes,
			innerBlocks: block.innerBlocks?.length || 0,
		} ) ),
		removed: removed.map( block => ( {
			clientId: block.clientId!,
			name: block.name,
			attributes: block.attributes,
			innerBlocks: block.innerBlocks?.length || 0,
		} ) ),
		modified,
	};
}

/**
 * Recursively merges block data, preserving existing properties that are not overridden by new data
 *
 * @param originalBlock - The original block to preserve properties from
 * @param newBlockData  - The new block data to apply
 * @param reverseMap    - Mapping of compressed to original IDs
 * @return Merged block data with preserved properties
 */
export function mergeBlocksRecursively(
	originalBlock: BlockData | undefined,
	newBlockData: BlockData,
	reverseMap: Record< string, string >
): BlockData {
	// If there's no original block, just use the new data
	if ( ! originalBlock ) {
		return newBlockData;
	}

	// Start with a merged block that preserves all properties
	const mergedBlock: BlockData = {
		...originalBlock,
		...newBlockData,
		// Deep merge attributes to preserve nested properties
		attributes: deepMerge( originalBlock.attributes || {}, newBlockData.attributes || {} ),
	};

	// Handle inner blocks recursively if they exist in the new data
	if ( newBlockData.innerBlocks ) {
		mergedBlock.innerBlocks = newBlockData.innerBlocks.map( newInnerBlock => {
			const originalClientId = reverseMap[ newInnerBlock.clientId! ];
			// Find the corresponding original inner block by clientId
			const originalInnerBlock = originalBlock.innerBlocks?.find(
				block => block.clientId === originalClientId
			);

			// Recursively merge this inner block
			return mergeBlocksRecursively( originalInnerBlock, newInnerBlock, reverseMap );
		} );
	} else {
		// If no new inner blocks specified, preserve the original ones
		mergedBlock.innerBlocks = originalBlock.innerBlocks || [];
	}

	return mergedBlock;
}
