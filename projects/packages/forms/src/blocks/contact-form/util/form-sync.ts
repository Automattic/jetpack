/**
 * Utility functions for synced form operations
 */

import { createBlock, serialize } from '@wordpress/blocks';

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
 * Serialize form attributes and blocks for saving to synced form post
 * Excludes the ref attribute since it's not part of the form definition
 *
 * @param {Record<string, unknown>} attributes  - Form attributes
 * @param {Array}                   innerBlocks - Form inner blocks
 * @return {string} Serialized block content
 */
export function serializeSyncedForm(
	attributes: Record< string, unknown >,
	innerBlocks: unknown[]
): string {
	const attributesToSave = { ...attributes };
	delete attributesToSave.ref;

	const formBlock = createBlock( 'jetpack/contact-form', attributesToSave, innerBlocks );

	return serialize( formBlock );
}
