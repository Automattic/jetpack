/**
 * Agent helper utilities adapted from Big Sky plugin
 */

import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import type { ApplyBlockEditsArgs } from '../types';

/**
 * Generate a short ID for client ID mapping
 * Uses a simple counter-based approach
 */
let idCounter = 0;
export function generateShortId(): string {
	return `b${ ++idCounter }`;
}

/**
 * Compress client IDs in blocks to shorter versions for context
 *
 * @param blocks - Array of blocks to compress
 * @return Object with compressed blocks and reverse mapping
 */
export function compressClientIds( blocks: BlockInstance[] ): {
	compressedBlocks: any[];
	reverseMap: Record< string, string >;
} {
	const reverseMap: Record< string, string > = {};

	const compressBlock = ( block: BlockInstance ): any => {
		if ( ! block?.clientId ) return block;

		// Generate a short ID for this clientId
		const shortId = generateShortId();
		reverseMap[ shortId ] = block.clientId;

		// Create the compressed block with the short id
		const compressed = {
			...block,
			clientId: shortId,
		};

		// Recursively compress innerBlocks if they exist
		if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
			compressed.innerBlocks = block.innerBlocks.map( compressBlock );
		}

		return compressed;
	};

	// Process each block in the array
	const compressedBlocks = blocks.map( compressBlock );

	return { compressedBlocks, reverseMap };
}

/**
 * Get the current page content with compressed client IDs
 *
 * @return Object with page blocks and client ID mapping
 */
export function getCurrentPageContent(): {
	blocks: any[];
	clientIdMap: Record< string, string >;
} {
	const { getBlocks } = select( blockEditorStore ) as any;

	// Get all blocks from the editor
	const allBlocks = getBlocks() || [];

	// Compress the client IDs
	const { compressedBlocks, reverseMap } = compressClientIds( allBlocks );

	return {
		blocks: compressedBlocks,
		clientIdMap: reverseMap,
	};
}

/**
 * Get available block types
 *
 * @return Array of available block type names
 */
export function getAvailableBlockTypes(): string[] {
	const { getBlockTypes } = select( blocksStore ) as any;
	const blockTypes = getBlockTypes() || [];
	return blockTypes.map( ( block: any ) => block.name );
}

/**
 * Create a context provider for the agent
 *
 * @return Context provider object
 */
export function createContextProvider() {
	return {
		getClientContext: () => {
			try {
				const { blocks, clientIdMap } = getCurrentPageContent();
				const availableBlocks = getAvailableBlockTypes();

				// Store the client ID map globally so tools can access it
				globalClientIdMap = clientIdMap;
				console.log( '[Agenttic] Stored clientIdMap:', clientIdMap );

				// Get selected block if any
				const { getSelectedBlockClientId } = select( blockEditorStore ) as any;
				const selectedClientId = getSelectedBlockClientId();

				// Find the short ID for the selected block
				let selectedBlockShortId = '';
				if ( selectedClientId ) {
					selectedBlockShortId =
						Object.keys( clientIdMap ).find( key => clientIdMap[ key ] === selectedClientId ) || '';
				}

				return {
					availableBlocks,
					currentPageContent: blocks,
					clientIdMap,
					selectedBlockClientId: selectedBlockShortId,
				};
			} catch ( error ) {
				console.error( '[Agenttic] Error getting client context:', error );
				return {};
			}
		},
	};
}

/**
 * Create a simple feature registry for tools
 */
interface Feature {
	id: string;
	name: string;
	description: string;
	input_schema: any;
	callback: ( args: any ) => Promise< any >;
}

class FeatureRegistry {
	private features: Map< string, Feature > = new Map();

	register( feature: Feature ): void {
		this.features.set( feature.id, feature );
	}

	getAll(): Feature[] {
		return Array.from( this.features.values() );
	}

	get( id: string ): Feature | undefined {
		return this.features.get( id );
	}

	async execute( id: string, args: any ): Promise< any > {
		const feature = this.get( id );
		if ( ! feature ) {
			throw new Error( `Tool with id '${ id }' not found` );
		}
		return feature.callback( args );
	}
}

// Global feature registry instance
export const featureRegistry = new FeatureRegistry();

/**
 * Register a feature/tool
 *
 * @param feature - Feature to register
 */
export function registerFeature( feature: Feature ): void {
	featureRegistry.register( feature );
}

/**
 * Store the current client ID map globally so it persists between tool calls
 */
let globalClientIdMap: Record< string, string > = {};

/**
 * Create a tool provider that uses the feature registry
 *
 * @param applyBlockEdits - The block editing function
 * @return Tool provider object
 */
export function createToolProvider(
	applyBlockEdits: ( args: ApplyBlockEditsArgs ) => Promise< any >
) {
	// Register the block editing tool
	registerFeature( {
		id: 'apply_block_edits',
		name: 'Apply Block Edits',
		description: 'Applies a collection of block edits to the WordPress block editor',
		input_schema: {
			type: 'object',
			properties: {
				updates: {
					type: 'array',
					description: 'Array of block update operations',
				},
				inserts: {
					type: 'array',
					description: 'Array of block insertion operations',
				},
				deletes: {
					type: 'array',
					description: 'Array of block deletion operations',
				},
				reverseMap: {
					type: 'object',
					description: 'Mapping of compressed IDs to original block client IDs',
				},
				summary: {
					type: 'string',
					description: 'A summary of the changes made',
				},
			},
			required: [],
		},
		callback: async ( args: any ) => {
			// Use the provided reverseMap if available, otherwise use the stored global map
			const reverseMap = args.reverseMap || globalClientIdMap;

			console.log( '[Agenttic] Using reverseMap:', reverseMap );
			console.log( '[Agenttic] Tool args:', args );

			// Call the block editing function with the reverse map
			const result = await applyBlockEdits( {
				...args,
				reverseMap,
			} );

			return result;
		},
	} );

	// Return the tool provider
	return {
		getAvailableTools: async () => {
			const features = featureRegistry.getAll();
			return features.map( ( { id, name, description, input_schema } ) => ( {
				id,
				name,
				description,
				input_schema,
			} ) );
		},
		executeTool: async ( toolId: string, args: any, _messageId?: string, _toolCallId?: string ) => {
			try {
				const result = await featureRegistry.execute( toolId, args );

				return {
					result: result.result || result,
					returnToAgent: result.returnToAgent !== false,
					agentMessage: result.agentMessage,
				};
			} catch ( error ) {
				console.error( `[Agenttic] Error executing tool ${ toolId }:`, error );
				return {
					result: {
						error: error instanceof Error ? error.message : 'Tool execution failed',
						details: String( error ),
					},
					returnToAgent: false,
				};
			}
		},
	};
}
