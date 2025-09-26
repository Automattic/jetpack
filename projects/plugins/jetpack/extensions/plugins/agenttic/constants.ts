/**
 * Constants for the Agenttic block editor integration
 */

/**
 * Tool names
 */
export const TOOL_NAMES = {
	APPLY_BLOCK_EDITS: 'apply_block_edits',
} as const;

/**
 * Block processing states
 */
export const BLOCK_PROCESSING_STATES = {
	IDLE: 'idle',
	PROCESSING: 'processing',
	COMPLETED: 'completed',
	ERROR: 'error',
} as const;

/**
 * CSS classes for block states
 */
export const BLOCK_CSS_CLASSES = {
	PROCESSING: 'agenttic-block--processing',
	ERROR: 'agenttic-block--error',
	MODIFIED: 'agenttic-block--modified',
} as const;

/**
 * Default configurations
 */
export const DEFAULT_CONFIG = {
	MAX_RETRIES: 3,
	RETRY_DELAY: 1000,
	ENABLE_IMAGE_GENERATION: false,
	ENABLE_CHECKPOINTS: false,
} as const;

/**
 * Block editor specific constants
 */
export const BLOCK_EDITOR = {
	DEFAULT_PARENT_SELECTOR: 'core/post-content',
	DEFAULT_INSERT_INDEX: 0,
} as const;

/**
 * Tool response messages
 */
export const TOOL_MESSAGES = {
	EDITS_COMPLETED: 'Block edits have been applied successfully.',
	NO_CHANGES: 'No changes were made to the blocks.',
	VALIDATION_ERROR: 'Block validation failed. Please check the block structure.',
	UNKNOWN_ERROR: 'An unexpected error occurred while applying block edits.',
} as const;

/**
 * Supported block operations
 */
export const BLOCK_OPERATIONS = {
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete',
	MOVE: 'move',
} as const;

export type ToolName = ( typeof TOOL_NAMES )[ keyof typeof TOOL_NAMES ];
export type BlockProcessingState =
	( typeof BLOCK_PROCESSING_STATES )[ keyof typeof BLOCK_PROCESSING_STATES ];
export type BlockOperation = ( typeof BLOCK_OPERATIONS )[ keyof typeof BLOCK_OPERATIONS ];
