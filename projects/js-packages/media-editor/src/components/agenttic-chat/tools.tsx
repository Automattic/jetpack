/**
 * Image Editing Tools for Agenttic Chat
 *
 * Provides AI agent with tools to manipulate images in the media editor.
 * These tools connect to the existing WordPress media editing functionality.
 */

import { useClientTools } from '@automattic/agenttic-client';
import { useCallback } from 'react';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Tool } from '@automattic/agenttic-client';
import type { MediaItem } from '../../types';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';

/**
 * Tool execution results
 */
interface ToolResult {
	success: boolean;
	message: string;
	data?: any;
	error?: string;
}

/**
 * Image editing tools available to the AI agent
 */
const imageEditingTools: Tool[] = [
	{
		id: 'image_crop',
		name: 'Crop Image',
		description: 'Crop the image to specified dimensions and position',
		input_schema: {
			type: 'object',
			properties: {
				x: {
					type: 'number',
					description: 'X coordinate of crop area (pixels from left)',
					minimum: 0,
				},
				y: {
					type: 'number',
					description: 'Y coordinate of crop area (pixels from top)',
					minimum: 0,
				},
				width: {
					type: 'number',
					description: 'Width of crop area in pixels',
					minimum: 1,
				},
				height: {
					type: 'number',
					description: 'Height of crop area in pixels',
					minimum: 1,
				},
				aspectRatio: {
					type: 'string',
					description: 'Optional aspect ratio (e.g., "16:9", "4:3", "1:1")',
					enum: [ '16:9', '4:3', '3:2', '1:1', 'custom' ],
				},
			},
			required: [ 'x', 'y', 'width', 'height' ],
		},
	},

	{
		id: 'image_resize',
		name: 'Resize Image',
		description: 'Resize the image to new dimensions',
		input_schema: {
			type: 'object',
			properties: {
				width: {
					type: 'number',
					description: 'New width in pixels',
					minimum: 1,
				},
				height: {
					type: 'number',
					description: 'New height in pixels',
					minimum: 1,
				},
				maintainAspectRatio: {
					type: 'boolean',
					description: 'Whether to maintain the original aspect ratio',
					default: true,
				},
			},
			required: [ 'width', 'height' ],
		},
	},

	{
		id: 'image_rotate',
		name: 'Rotate Image',
		description: 'Rotate the image by specified degrees',
		input_schema: {
			type: 'object',
			properties: {
				degrees: {
					type: 'number',
					description: 'Rotation angle in degrees (positive = clockwise)',
					minimum: -360,
					maximum: 360,
				},
			},
			required: [ 'degrees' ],
		},
	},

	{
		id: 'image_metadata',
		name: 'Get Image Metadata',
		description: 'Retrieve detailed metadata about the current image',
		input_schema: {
			type: 'object',
			properties: {},
		},
	},

	{
		id: 'image_reset',
		name: 'Reset Image Changes',
		description: 'Reset all changes and return to original image',
		input_schema: {
			type: 'object',
			properties: {},
		},
	},

	{
		id: 'update_media_editor',
		name: 'Update Media Editor',
		description: 'Apply a server-generated media update to the media editor UI',
		input_schema: {
			type: 'object',
			properties: {
				attachmentId: {
					type: 'integer',
					description: 'ID of the new or updated attachment',
				},
				url: {
					type: 'string',
					description: 'URL of the generated/edited image',
				},
				altText: {
					type: 'string',
					description: 'Alt text for the image',
				},
				isNewImage: {
					type: 'boolean',
					description: 'Whether this is a new image or a replacement',
					default: true,
				},
				summary: {
					type: 'string',
					description: 'Short summary of the action',
				},
				followUpTasks: {
					type: 'boolean',
					description: 'Whether more steps remain',
					default: false,
				},
			},
			required: [ 'url' ],
		},
	},
];

/**
 * Hook to provide image editing tools for agenttic chat
 */
export const useImageEditingTools = ( _currentPost?: MediaItem | null ) => {
	const { setIsAiProcessing, addToAiEditHistory, addAiVariant } = useMediaEditorState();
	const { invalidateResolution } = useDispatch( coreStore ) as any;

	const executeImageTool = useCallback(
		async ( toolId: string, args: any ): Promise< ToolResult > => {
			try {
				switch ( toolId ) {
					case 'image_crop':
						return await executeCropTool( args );

					case 'image_resize':
						return await executeResizeTool( args );

					case 'image_rotate':
						return await executeRotateTool( args );

					// case 'image_metadata':
					// 	return await executeMetadataTool( args );

					case 'image_reset':
						return await executeResetTool( args );

					case 'update_media_editor': {
						// Apply server-provided media update to UI state
						try {
							// eslint-disable-next-line no-console
							console.log( '[Agenttic][Tools] Applying update_media_editor:', args );
							const variantId = addAiVariant( {
								attachmentId: args?.attachmentId,
								url: args?.url,
								altText: args?.altText,
								summary: args?.summary,
								isNewImage: args?.isNewImage,
							} );
							addToAiEditHistory( {
								id: variantId,
								prompt: args?.summary || 'Server media update',
								imageUrl: args?.url,
								attachmentId: args?.attachmentId,
							} );
							if ( args?.attachmentId ) {
								invalidateResolution( 'getEntityRecord', [
									'postType',
									'attachment',
									args.attachmentId,
								] );
							}
							setIsAiProcessing( false );
							return {
								success: true,
								message: args?.summary || 'Applied server media update',
								data: {
									url: args?.url,
									attachmentId: args?.attachmentId,
									isNewImage: args?.isNewImage,
								},
							};
						} catch ( e ) {
							setIsAiProcessing( false );
							return {
								success: false,
								message: `Failed to apply media update: ${
									e instanceof Error ? e.message : String( e )
								}`,
								error: e instanceof Error ? e.message : String( e ),
							};
						}
					}

					default:
						return {
							success: false,
							message: `Unknown tool: ${ toolId }`,
							error: 'UNKNOWN_TOOL',
						};
				}
			} catch ( error ) {
				return {
					success: false,
					message: `Error executing ${ toolId }: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		},
		[ setIsAiProcessing, addToAiEditHistory, addAiVariant, invalidateResolution ]
	);

	return useClientTools( async () => imageEditingTools, executeImageTool );
};

// Tool execution functions (TODO: Connect to actual media editor functionality)

async function executeCropTool( args: any ): Promise< ToolResult > {
	// TODO: Connect to actual crop functionality
	console.log( 'Executing crop tool with args:', args );

	return {
		success: true,
		message: `Image cropped to ${ args.width }x${ args.height } at position (${ args.x }, ${ args.y })`,
		data: {
			newDimensions: { width: args.width, height: args.height },
			cropArea: {
				x: args.x,
				y: args.y,
				width: args.width,
				height: args.height,
			},
		},
	};
}

async function executeResizeTool( args: any ): Promise< ToolResult > {
	// TODO: Connect to actual resize functionality
	console.log( 'Executing resize tool with args:', args );

	return {
		success: true,
		message: `Image resized to ${ args.width }x${ args.height }`,
		data: {
			newDimensions: { width: args.width, height: args.height },
			maintainedAspectRatio: args.maintainAspectRatio,
		},
	};
}

async function executeRotateTool( args: any ): Promise< ToolResult > {
	// TODO: Connect to actual rotation functionality
	console.log( 'Executing rotate tool with args:', args );

	return {
		success: true,
		message: `Image rotated by ${ args.degrees } degrees`,
		data: {
			rotation: args.degrees,
		},
	};
}

async function executeResetTool( _args: any ): Promise< ToolResult > {
	// TODO: Connect to actual reset functionality
	console.log( 'Executing reset tool' );

	return {
		success: true,
		message: 'All changes have been reset to original image',
		data: {
			changesCleared: true,
		},
	};
}
/**
 * Default export
 */
export default useImageEditingTools;
