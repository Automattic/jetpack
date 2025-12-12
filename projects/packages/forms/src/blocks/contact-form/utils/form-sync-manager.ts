/**
 * Form Sync Manager
 * Utilities for converting forms between inline and synced modes
 */

import apiFetch from '@wordpress/api-fetch';
import { serialize } from '@wordpress/blocks';

const FORM_BLOCK_NAME = 'jetpack/contact-form';

export interface BlockData {
	attributes: Record< string, unknown >;
	innerBlocks: unknown[];
}

export interface JetpackFormPost {
	id: number;
	title: { rendered: string };
	content: { raw: string; rendered: string };
	status: string;
}

/**
 * Serializes a block (with attributes and innerBlocks) to block markup string
 *
 * @param {object} blockData - Block data containing attributes and innerBlocks
 * @return {string} Serialized block markup
 */
export function serializeFormBlock( blockData: BlockData ): string {
	return serialize( [
		{
			name: FORM_BLOCK_NAME,
			attributes: blockData?.attributes,
			innerBlocks: blockData?.innerBlocks,
		},
	] );
}

/**
 * Creates a new synced form in the jetpack_form post type
 *
 * @param {object} blockData - Block data containing attributes and innerBlocks
 * @param {string} pageTitle - Title for the form post
 * @return {Promise<number>} Created post ID
 */
export async function createSyncedForm(
	blockData: BlockData,
	pageTitle: string
): Promise< number > {
	const blockMarkup = serializeFormBlock( blockData );
	const response = ( await apiFetch( {
		path: '/wp/v2/jetpack-forms',
		method: 'POST',
		data: {
			title: pageTitle || 'Untitled Form',
			content: blockMarkup,
			status: 'publish',
		},
	} ) ) as JetpackFormPost;

	return response.id;
}
