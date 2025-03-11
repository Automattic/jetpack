/**
 * External dependencies
 */
import { askQuestionSync, getAllBlocks, usePostContent } from '@automattic/jetpack-ai-client';
import { select as globalSelect, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { preprocessImageContent } from '../../../../blocks/ai-assistant/extensions/lib/preprocess-image-content';
/**
 * Types
 */
import type { PromptType } from './types';
import type { Block } from '@automattic/jetpack-ai-client';

const debug = debugFactory( 'seo-enhancer:use-seo-requests' );

const parseResponse = ( response: string ) => {
	const parsedResponse: {
		texts?: string[];
		descriptions?: string[];
		titles?: string[];
	} = JSON.parse(
		response
			?.replace?.( /^```json\s*/, '' ) // Remove the markdown code block if it exists.
			?.replace( /```$/, '' )
	);

	return parsedResponse;
};

export const useSeoRequests = ( features: PromptType[] = [] ) => {
	const { editPost } = useDispatch( editorStore );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const { getPostContent } = usePostContent();

	const request = useCallback(
		async ( type: PromptType, block?: Block ) => {
			let context: Record< string, unknown > = { type };
			let feature = 'jetpack-seo-assistant';

			if ( type === 'seo-title' || type === 'seo-meta-description' ) {
				context = {
					...context,
					content: getPostContent(),
					count: 1,
				};
			}

			if ( type === 'images-alt-text' ) {
				context = {
					...context,
					content: getPostContent( preprocessImageContent ),
					// TODO: Check if site is private and use base64 image instead of url
					images: [ { url: block?.attributes.url } ],
				};

				feature = 'jetpack-ai-image-extension';
			}

			return askQuestionSync(
				[
					{
						role: 'jetpack-ai' as const,
						context,
					},
				],
				{
					postId,
					feature,
				}
			);
		},
		[ getPostContent, postId ]
	);

	const updateTitle = useCallback(
		async ( force: boolean = false ) => {
			const hasTitle =
				!! globalSelect( 'core/editor' ).getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title;

			if ( hasTitle && force !== true ) {
				return;
			}

			try {
				const response = await request( 'seo-title' );
				const title = parseResponse( response ).titles?.[ 0 ];

				editPost( {
					meta: {
						jetpack_seo_html_title: title,
					},
				} );
			} catch ( error ) {
				debug( 'Error updating title', error );
			}
		},
		[ request, editPost ]
	);

	const updateDescription = useCallback(
		async ( force: boolean = false ) => {
			const hasDescription =
				!! globalSelect( 'core/editor' ).getEditedPostAttribute( 'meta' )?.advanced_seo_description;

			if ( hasDescription && force !== true ) {
				return;
			}

			try {
				const response = await request( 'seo-meta-description' );
				const description = parseResponse( response ).descriptions?.[ 0 ];
				editPost( {
					meta: {
						advanced_seo_description: description,
					},
				} );
			} catch ( error ) {
				debug( 'Error updating description', error );
			}
		},
		[ request, editPost ]
	);

	const updateAltTexts = useCallback(
		async ( force: boolean = false ) => {
			const imageBlocks = getAllBlocks().filter( block => block.name === 'core/image' );
			const imageBlocksWithoutAltText = imageBlocks.filter( block => ! block.attributes.alt );
			const blocks = force ? imageBlocks : imageBlocksWithoutAltText;

			blocks.forEach( async block => {
				try {
					const response = await request( 'images-alt-text', block );
					const altText = parseResponse( response ).texts?.[ 0 ];

					await updateBlockAttributes( block.clientId, { alt: altText } );
				} catch ( error ) {
					debug( 'Error updating alt texts', error );
				}
			} );
		},
		[ request, updateBlockAttributes ]
	);

	const updateSeoData = useCallback( () => {
		const promises = [];

		features.forEach( feature => {
			if ( feature === 'seo-title' ) {
				promises.push( updateTitle() );
			}
			if ( feature === 'seo-meta-description' ) {
				promises.push( updateDescription() );
			}
			if ( feature === 'images-alt-text' ) {
				promises.push( updateAltTexts() );
			}
		} );

		return Promise.all( promises );
	}, [ features, updateTitle, updateDescription, updateAltTexts ] );

	return { updateSeoData };
};
