/**
 * Utility functions for synced form operations
 */

import { createBlock, serialize } from '@wordpress/blocks';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

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

/**
 * Check if we're in a synced form context
 * Returns true if we have a ref and we're NOT editing the form post itself
 *
 * @param {number | undefined} ref      - Form reference ID
 * @param {string}             postType - Current post type being edited
 * @return {boolean} True if in synced form context
 */
export function isSyncedFormContext( ref: number | undefined, postType: string ): boolean {
	return !! ref && postType !== FORM_POST_TYPE;
}
