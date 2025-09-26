/**
 * Types for block editing functionality
 */

import type { BlockInstance } from '@wordpress/blocks';

/**
 * Represents a block's attributes
 */
export interface BlockAttributes {
	[ key: string ]: any;
}

/**
 * Represents a block's data structure
 */
export interface BlockData {
	name: string;
	clientId?: string;
	attributes?: BlockAttributes;
	innerBlocks?: BlockData[];
}

/**
 * Represents a block update operation
 */
export interface BlockUpdate {
	clientId: string;
	name: string;
	attributes?: BlockAttributes;
	innerBlocks?: BlockData[];
}

/**
 * Represents a block insertion operation
 */
export interface BlockInsertion {
	parentClientId?: string;
	index?: number;
	block: BlockData;
}

/**
 * Represents the result of block edit operations
 */
export interface BlockEditResults {
	updates?: BlockUpdate[];
	inserts?: BlockInsertion[];
	deletes?: string[];
	summary?: string;
}

/**
 * Arguments passed to the apply block edits tool
 */
export interface ApplyBlockEditsArgs {
	updates?: BlockUpdate[];
	inserts?: BlockInsertion[];
	deletes?: string[];
	reverseMap: Record< string, string >;
	messageId?: string;
	summary?: string;
	followUpTasks?: string[];
}

/**
 * Result returned from applying block edits
 */
export interface ApplyBlockEditsResult {
	result: string;
	returnToAgent?: string[];
}

/**
 * State for tracking block differences
 */
export interface BlockDifference {
	clientId: string;
	name: string;
	changes?: Record< string, any >;
	attributes?: BlockAttributes;
	innerBlocks?: number;
}

/**
 * Comparison result between block states
 */
export interface BlockStateComparison {
	added: BlockDifference[];
	removed: BlockDifference[];
	modified: BlockDifference[];
}

/**
 * Configuration for the block edits tool
 */
export interface BlockEditsToolConfig {
	enableImageGeneration?: boolean;
	enableCheckpoints?: boolean;
}

/**
 * Tool registration function type
 */
export type RegisterToolFunction = (
	args: ApplyBlockEditsArgs
) => Promise< ApplyBlockEditsResult >;

/**
 * Hook return type for useApplyBlockEdits
 */
export interface UseApplyBlockEditsReturn {
	applyBlockEdits: RegisterToolFunction;
	isProcessing: boolean;
}
