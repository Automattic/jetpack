/**
 * Hook to load and manage synced forms from jetpack_form post type
 */

import { parse } from '@wordpress/blocks';
import { useEntityRecord } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

// Infer the block type from the parse function's return type
type ParsedBlock = ReturnType< typeof parse >[ number ];
interface JetpackForm {
	content?: { raw: string } | undefined;
}

interface UseSyncedFormResult {
	isLoading: boolean;
	syncedAttributes: Record< string, unknown > | null;
	syncedInnerBlocks: ParsedBlock[] | null;
	syncedForm: JetpackForm | null;
}

/**
 * Custom hook to load a synced form from jetpack_form post type
 * When a form block has a `ref` attribute, this hook loads the full block content
 * from the referenced jetpack_form post and returns the parsed attributes and innerBlocks
 *
 * @param {number | undefined} ref - The jetpack_form post ID to load
 * @return {UseSyncedFormResult} Object containing loading state and parsed block data
 */
export function useSyncedForm( ref: number | undefined ): UseSyncedFormResult {
	const { record, isResolving } = useEntityRecord< JetpackForm >( 'postType', FORM_POST_TYPE, ref );

	// Parse the block content when the post is loaded
	const { syncedAttributes, syncedInnerBlocks } = useMemo( () => {
		if ( ! record?.content?.raw ) {
			return { syncedAttributes: null, syncedInnerBlocks: null };
		}

		const parsedBlocks = parse( record.content.raw );

		if ( ! parsedBlocks || parsedBlocks.length === 0 ) {
			return { syncedAttributes: null, syncedInnerBlocks: null };
		}

		// Get the first block (should be the contact-form block)
		const formBlock = parsedBlocks[ 0 ];

		if ( formBlock.name !== 'jetpack/contact-form' ) {
			return { syncedAttributes: null, syncedInnerBlocks: null };
		}

		return {
			syncedAttributes: formBlock.attributes || {},
			syncedInnerBlocks: formBlock.innerBlocks || [],
		};
	}, [ record ] );

	if ( ! ref ) {
		return {
			isLoading: false,
			syncedAttributes: null,
			syncedInnerBlocks: null,
			syncedForm: null,
		};
	}

	return {
		isLoading: isResolving,
		syncedAttributes,
		syncedInnerBlocks,
		syncedForm: record,
	};
}
