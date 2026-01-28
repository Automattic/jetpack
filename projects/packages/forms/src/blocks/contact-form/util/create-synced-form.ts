/**
 * Form Sync Manager
 * Utilities for converting forms between inline and synced modes
 */

import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	FORM_POST_TYPE,
	FORM_BLOCK_NAME,
	FORM_SOURCE_META_KEY,
} from '../../shared/util/constants.js';
import type { Block } from '@wordpress/blocks';

export interface JetpackFormPost {
	id: number;
	title: { rendered: string };
	content: { raw: string; rendered: string };
	status: string;
}

/**
 * Creates a new synced form in the jetpack_form post type
 *
 * @param {Block}  blockData     - Block data containing attributes and innerBlocks
 * @param {string} pageTitle     - Title for the form post
 * @param {number} currentPostId - Current post ID to remember the source of the form.
 * @return {Promise<number>} Created post ID
 */
export async function createSyncedForm(
	blockData: Block,
	pageTitle: string,
	currentPostId: number
): Promise< number > {
	const blockMarkup = serialize( [
		{
			name: FORM_BLOCK_NAME,
			attributes: blockData?.attributes,
			innerBlocks: blockData?.innerBlocks,
		},
	] );
	const response = ( await dispatch( coreStore ).saveEntityRecord( 'postType', FORM_POST_TYPE, {
		title: pageTitle || __( 'Untitled Form', 'jetpack-forms' ),
		content: blockMarkup,
		status: 'publish',
		meta: {
			[ FORM_SOURCE_META_KEY ]: currentPostId,
		},
	} ) ) as JetpackFormPost;

	return response.id;
}
