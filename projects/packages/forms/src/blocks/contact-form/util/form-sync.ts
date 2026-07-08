/**
 * Utility functions for synced form operations
 */

import { createBlock, serialize } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';

/**
 * Filter out attributes that shouldn't be synced from source
 * These are local layout attributes that should remain independent
 *
 * @param {Record<string, unknown>} attributes - Form attributes to filter
 * @return {Record<string, unknown>} Filtered attributes safe to sync
 */
export function filterSyncedAttributes(
	attributes: Record< string, unknown >
): Record< string, unknown > {
	const filtered = { ...attributes };
	// Don't override layout attributes or ref
	delete filtered.className;
	delete filtered.align;
	delete filtered.style;
	delete filtered.ref;
	delete filtered.lock;
	return filtered;
}

/**
 * Create a form block for staging/saving.
 * Excludes ref and lock attributes since they're not part of the form definition.
 *
 * @param {Record<string, unknown>} attributes  - Form attributes.
 * @param {Array}                   innerBlocks - Form inner blocks.
 * @return {Block} The created form block.
 */
export function createSyncedFormBlock(
	attributes: Record< string, unknown >,
	innerBlocks: Block[]
): Block {
	const attributesToSave = { ...attributes };
	delete attributesToSave.ref;
	delete attributesToSave.lock;

	return createBlock( 'jetpack/contact-form', attributesToSave, innerBlocks );
}

/**
 * Serialize form attributes and blocks for saving to synced form post
 * Excludes the ref attribute since it's not part of the form definition
 *
 * @param {Record<string, unknown>} attributes  - Form attributes
 * @param {Block[]}                 innerBlocks - Form inner blocks
 * @return {string} Serialized block content
 */
export function serializeSyncedForm(
	attributes: Record< string, unknown >,
	innerBlocks: Block[]
): string {
	const formBlock = createSyncedFormBlock( attributes, innerBlocks );
	return serialize( formBlock );
}
