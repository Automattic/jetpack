/**
 * Hook to load and manage synced forms from jetpack_form post type
 */

import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

interface UseSyncedFormResult {
	isLoading: boolean;
	syncedAttributes: Record< string, unknown > | null;
	syncedInnerBlocks: unknown[] | null;
	reusableForm: { content?: { raw?: string } } | null;
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
	// Load the jetpack_form post using WordPress core-data
	const { reusableForm, isResolvingReusableForm } = useSelect(
		select => {
			if ( ! ref ) {
				return { reusableForm: null, isResolvingReusableForm: false };
			}

			const { getEntityRecord, isResolving } = select( coreStore );

			const form = getEntityRecord( 'postType', 'jetpack_form', ref );
			const resolving = isResolving( 'getEntityRecord', [ 'postType', 'jetpack_form', ref ] );

			return {
				reusableForm: form,
				isResolvingReusableForm: resolving,
			};
		},
		[ ref ]
	);

	// Parse the block content when the post is loaded
	const { syncedAttributes, syncedInnerBlocks } = useMemo( () => {
		if ( ! reusableForm?.content?.raw ) {
			return { syncedAttributes: null, syncedInnerBlocks: null };
		}

		const parsedBlocks = parse( reusableForm.content.raw );

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
	}, [ reusableForm ] );

	return {
		isLoading: isResolvingReusableForm,
		syncedAttributes,
		syncedInnerBlocks,
		reusableForm,
	};
}
