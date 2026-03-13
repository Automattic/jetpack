/**
 * Hook to load and manage synced forms from jetpack_form post type
 */

import { parse } from '@wordpress/blocks';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import type { Block } from '@wordpress/blocks';

// Infer the block type from the parse function's return type
type ParsedBlock = ReturnType< typeof parse >[ number ];
interface JetpackForm {
	content?: { raw: string } | undefined;
	status: string;
	date: string;
}

interface UseSyncedFormResult {
	isLoading: boolean;
	syncedAttributes: Record< string, unknown > | null;
	syncedInnerBlocks: ParsedBlock[] | null;
	syncedForm: JetpackForm | null;
}

const EMPTY_FORM = { syncedAttributes: null, syncedInnerBlocks: null };

/**
 * Custom hook to load a synced form from jetpack_form post type
 * When a form block has a `ref` attribute, this hook loads the full block content
 * from the referenced jetpack_form post and returns the parsed attributes and innerBlocks
 *
 * @param {number | undefined} ref - The jetpack_form post ID to load
 * @return {UseSyncedFormResult} Object containing loading state and parsed block data
 */
export function useSyncedForm( ref: number | undefined ): UseSyncedFormResult {
	const { record, isResolving, status, hasEdits } = useEntityRecord< JetpackForm >(
		'postType',
		FORM_POST_TYPE,
		ref,
		{
			enabled: !! ref,
		}
	);

	// Get the actual pending edits object to see exactly what's being changed
	const pendingEdits = useSelect(
		select => {
			if ( ! ref ) {
				return null;
			}
			return select( coreStore ).getEntityRecordEdits( 'postType', FORM_POST_TYPE, ref );
		},
		[ ref ]
	);

	// Check if there are pending edits (either blocks or content)
	const pendingBlocks = useMemo( () => {
		if ( ! hasEdits || ! pendingEdits ) {
			return null;
		}
		const edits = pendingEdits as Record< string, unknown >;

		// First check for block edits (from block editor)
		if ( edits.blocks && Array.isArray( edits.blocks ) ) {
			return edits.blocks as Block[];
		}

		// Then check for content edits (from our auto-save which stores serialized content)
		if ( typeof edits.content === 'string' ) {
			const parsedBlocks = parse( edits.content );
			return parsedBlocks.length > 0 ? parsedBlocks : null;
		}

		return null;
	}, [ hasEdits, pendingEdits ] );

	// Parse the block content - prefer pending edits over saved record
	const { syncedAttributes, syncedInnerBlocks } = useMemo( () => {
		// If we have pending block edits, use those instead of saved content
		if ( pendingBlocks && pendingBlocks.length > 0 ) {
			const formBlock = pendingBlocks[ 0 ];

			if ( formBlock.name !== 'jetpack/contact-form' ) {
				return { syncedAttributes: null, syncedInnerBlocks: null };
			}

			// Get attributes and add 'ref' (lock is stripped via destructuring)
			const attrs = ( formBlock.attributes || {} ) as Record< string, unknown >;
			const { lock, ...attributesWithoutLock } = attrs;
			void lock; // Intentionally unused - stripped from synced attributes
			const finalAttributes = {
				...attributesWithoutLock,
				ref,
			};

			return {
				syncedAttributes: finalAttributes,
				syncedInnerBlocks: formBlock.innerBlocks || [],
			};
		}

		// Fall back to saved record content
		if ( ! record?.content?.raw ) {
			return EMPTY_FORM;
		}

		const parsedBlocks = parse( record.content.raw );

		if ( ! parsedBlocks || parsedBlocks.length === 0 ) {
			return EMPTY_FORM;
		}

		// Get the first block (should be the contact-form block)
		const formBlock = parsedBlocks[ 0 ];

		if ( formBlock.name !== 'jetpack/contact-form' ) {
			return EMPTY_FORM;
		}

		// Get attributes and add 'ref' (lock is stripped via destructuring)
		const attrs = ( formBlock.attributes || {} ) as Record< string, unknown >;
		const { lock, ...attributesWithoutLock } = attrs;
		void lock; // Intentionally unused - stripped from synced attributes
		const finalAttributes = {
			...attributesWithoutLock,
			ref,
		};

		return {
			syncedAttributes: finalAttributes,
			syncedInnerBlocks: formBlock.innerBlocks || [],
		};
	}, [ pendingBlocks, record, ref ] );

	if ( ! ref ) {
		return {
			isLoading: false,
			syncedAttributes: null,
			syncedInnerBlocks: null,
			syncedForm: null,
		};
	}

	// IDLE Status is when we haven't started the loading process just yet.
	if ( status === 'IDLE' ) {
		return {
			isLoading: true,
			syncedAttributes,
			syncedInnerBlocks,
			syncedForm: record,
		};
	}

	return {
		isLoading: isResolving,
		syncedAttributes,
		syncedInnerBlocks,
		syncedForm: record,
	};
}
