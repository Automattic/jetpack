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
const DEBUG = true;
const log = ( ...args: unknown[] ) => DEBUG && console.log( '[useSyncedForm]', ...args );

export function useSyncedForm( ref: number | undefined ): UseSyncedFormResult {
	const { record, isResolving, hasEdits } = useEntityRecord< JetpackForm >(
		'postType',
		FORM_POST_TYPE,
		ref
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

	log( 'Hook called', {
		ref,
		isResolving,
		hasEdits,
		hasRecord: !! record,
		recordContentLength: record?.content?.raw?.length,
		hasPendingEdits: !! pendingEdits,
		pendingEditKeys: pendingEdits ? Object.keys( pendingEdits ) : [],
	} );

	// Check if there are pending block edits
	const pendingBlocks = useMemo( () => {
		if ( ! hasEdits || ! pendingEdits ) {
			log( 'No pending blocks', { hasEdits, hasPendingEdits: !! pendingEdits } );
			return null;
		}
		const edits = pendingEdits as Record< string, unknown >;
		if ( ! edits.blocks || ! Array.isArray( edits.blocks ) ) {
			log( 'Pending edits exist but no blocks field', { editKeys: Object.keys( edits ) } );
			return null;
		}
		log( 'Found pending blocks', { blockCount: edits.blocks.length } );
		return edits.blocks as Block[];
	}, [ hasEdits, pendingEdits ] );

	// Parse the block content - prefer pending edits over saved record
	const { syncedAttributes, syncedInnerBlocks } = useMemo( () => {
		// If we have pending block edits, use those instead of saved content
		if ( pendingBlocks && pendingBlocks.length > 0 ) {
			const formBlock = pendingBlocks[ 0 ];

			if ( formBlock.name !== 'jetpack/contact-form' ) {
				console.log(
					'[useSyncedForm] Pending blocks first block is not contact-form:',
					formBlock.name
				);
				return { syncedAttributes: null, syncedInnerBlocks: null };
			}

			// Get attributes, strip out 'lock', and add 'ref'
			const { lock, ...attributesWithoutLock } = ( formBlock.attributes || {} ) as Record<
				string,
				unknown
			>;
			const finalAttributes = {
				...attributesWithoutLock,
				ref,
			};

			console.log( '[useSyncedForm] Using pending edits for synced form', {
				source: 'pendingEdits',
				ref,
				strippedLock: !! lock,
				attributeKeys: Object.keys( finalAttributes ),
				innerBlocksCount: formBlock.innerBlocks?.length ?? 0,
			} );

			return {
				syncedAttributes: finalAttributes,
				syncedInnerBlocks: formBlock.innerBlocks || [],
			};
		}

		// Fall back to saved record content
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

		// Get attributes, strip out 'lock', and add 'ref'
		const { lock, ...attributesWithoutLock } = ( formBlock.attributes || {} ) as Record<
			string,
			unknown
		>;
		const finalAttributes = {
			...attributesWithoutLock,
			ref,
		};

		console.log( '[useSyncedForm] Using saved record for synced form', {
			source: 'record',
			ref,
			strippedLock: !! lock,
			attributeKeys: Object.keys( finalAttributes ),
			innerBlocksCount: formBlock.innerBlocks?.length ?? 0,
		} );

		return {
			syncedAttributes: finalAttributes,
			syncedInnerBlocks: formBlock.innerBlocks || [],
		};
	}, [ pendingBlocks, record, record?.content?.raw, ref ] );

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
