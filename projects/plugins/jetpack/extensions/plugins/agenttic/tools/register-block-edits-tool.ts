/**
 * Tool registration for block editing functionality
 */

import type { RegisterToolFunction } from '../types';
import { TOOL_NAMES } from '../constants';

/**
 * Tool configuration interface for registration with the agent
 */
interface ToolConfig {
	id: string;
	name: string;
	description: string;
	inputSchema: {
		type: string;
		properties: Record< string, any >;
		required?: string[];
	};
	handler: RegisterToolFunction;
}

/**
 * Creates the input schema for the block edits tool
 *
 * @return The JSON schema for the tool input
 */
function createBlockEditsInputSchema() {
	return {
		type: 'object',
		properties: {
			updates: {
				type: 'array',
				description: 'Array of block update operations',
				items: {
					type: 'object',
					properties: {
						clientId: {
							type: 'string',
							description: 'The client ID of the block to update',
						},
						name: {
							type: 'string',
							description: 'The block type name',
						},
						attributes: {
							type: 'object',
							description: 'Block attributes to update',
						},
						innerBlocks: {
							type: 'array',
							description: 'Inner blocks structure',
						},
					},
					required: [ 'clientId', 'name' ],
				},
			},
			inserts: {
				type: 'array',
				description: 'Array of block insertion operations',
				items: {
					type: 'object',
					properties: {
						parentClientId: {
							type: 'string',
							description: 'The client ID of the parent block',
						},
						index: {
							type: 'number',
							description: 'The index to insert the block at',
						},
						block: {
							type: 'object',
							description: 'The block to insert',
							properties: {
								name: {
									type: 'string',
									description: 'The block type name',
								},
								attributes: {
									type: 'object',
									description: 'Block attributes',
								},
								innerBlocks: {
									type: 'array',
									description: 'Inner blocks',
								},
							},
							required: [ 'name' ],
						},
					},
					required: [ 'block' ],
				},
			},
			deletes: {
				type: 'array',
				description: 'Array of client IDs of blocks to delete',
				items: {
					type: 'string',
				},
			},
			reverseMap: {
				type: 'object',
				description: 'Mapping of compressed IDs to original block client IDs',
				additionalProperties: {
					type: 'string',
				},
			},
			summary: {
				type: 'string',
				description: 'A summary of the changes made',
			},
			followUpTasks: {
				type: 'array',
				description: 'Follow-up tasks for the agent',
				items: {
					type: 'string',
				},
			},
		},
		required: [ 'reverseMap' ],
	};
}

/**
 * Registers the block edits tool with the agent system
 *
 * @param applyBlockEditsCallback - The callback function that applies block edits
 * @param agent                   - The agent instance to register the tool with
 * @return A function to unregister the tool
 */
export function registerBlockEditsTool(
	applyBlockEditsCallback: RegisterToolFunction,
	agent?: any
): ( () => void ) | undefined {
	const toolConfig: ToolConfig = {
		id: TOOL_NAMES.APPLY_BLOCK_EDITS,
		name: 'Apply Block Edits',
		description: 'Applies a collection of block edits to the WordPress block editor',
		inputSchema: createBlockEditsInputSchema(),
		handler: applyBlockEditsCallback,
	};

	// If agent is provided, register the tool
	if ( agent && typeof agent.registerTool === 'function' ) {
		const unregister = agent.registerTool( toolConfig );

		console.log( `[Agenttic] Registered tool: ${ TOOL_NAMES.APPLY_BLOCK_EDITS }` );

		// Return unregister function
		return unregister;
	}

	// For compatibility with different agent systems, also try global registration
	if ( typeof window !== 'undefined' && ( window as any ).wp?.agenttic?.registerTool ) {
		const unregister = ( window as any ).wp.agenttic.registerTool( toolConfig );

		console.log( `[Agenttic] Registered tool globally: ${ TOOL_NAMES.APPLY_BLOCK_EDITS }` );

		return unregister;
	}

	console.warn( '[Agenttic] No agent system found to register block edits tool' );
	return undefined;
}

/**
 * Creates a tool registration function that can be used with different agent systems
 *
 * @param applyBlockEditsCallback - The callback function that applies block edits
 * @return A registration function that accepts an agent instance
 */
export function createBlockEditsToolRegistrar( applyBlockEditsCallback: RegisterToolFunction ) {
	return ( agent?: any ) => registerBlockEditsTool( applyBlockEditsCallback, agent );
}

export default registerBlockEditsTool;
