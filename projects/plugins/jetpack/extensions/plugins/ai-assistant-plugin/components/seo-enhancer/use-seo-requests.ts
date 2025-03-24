/**
 * External dependencies
 */
import {
	askQuestionSync,
	getAllBlocks,
	getBase64Image,
	useAiFeature,
	usePostContent,
} from '@automattic/jetpack-ai-client';
import { select as globalSelect, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { preprocessImageContent } from '../../../../blocks/ai-assistant/extensions/lib/preprocess-image-content';
import { store } from './store';
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

export const useSeoRequests = (
	features: PromptType[] = [ 'seo-title', 'seo-meta-description', 'images-alt-text' ]
) => {
	const { editPost } = useDispatch( editorStore );
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const { getPostContent } = usePostContent();
	const isBusy = useSelect( select => select( store ).isBusy(), [] );
	const { setBusy, setTitleBusy, setDescriptionBusy } = useDispatch( store );
	const { isImageBusy, hasImageFailed } = useSelect( select => select( store ), [] );
	const { setImageBusy, setImageFailed } = useDispatch( store );
	const { createInfoNotice } = useDispatch( 'core/notices' );
	const { increaseRequestsCount, dequeueAsyncRequest, requireUpgrade } = useAiFeature();

	const request = useCallback(
		async ( type: PromptType, block?: Block, useBase64Image: boolean = false ) => {
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
					images: [
						{
							url: useBase64Image
								? await getBase64Image( block?.attributes.url as string )
								: block?.attributes.url,
						},
					],
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
				return null;
			}

			try {
				setTitleBusy( true );
				const response = await request( 'seo-title' );
				const title = parseResponse( response ).titles?.[ 0 ];

				editPost( {
					meta: {
						jetpack_seo_html_title: title,
					},
				} );

				return true;
			} catch ( error ) {
				debug( 'Error updating title', error );
				return false;
			} finally {
				setTitleBusy( false );
			}
		},
		[ setTitleBusy, request, editPost ]
	);

	const updateDescription = useCallback(
		async ( force: boolean = false ) => {
			const hasDescription =
				!! globalSelect( 'core/editor' ).getEditedPostAttribute( 'meta' )?.advanced_seo_description;

			if ( hasDescription && force !== true ) {
				return null;
			}

			try {
				setDescriptionBusy( true );
				const response = await request( 'seo-meta-description' );
				const description = parseResponse( response ).descriptions?.[ 0 ];
				editPost( {
					meta: {
						advanced_seo_description: description,
					},
				} );

				return true;
			} catch ( error ) {
				debug( 'Error updating description', error );
				return false;
			} finally {
				setDescriptionBusy( false );
			}
		},
		[ setDescriptionBusy, request, editPost ]
	);

	const updateAltText = useCallback(
		async ( block: Block, useBase64Image: boolean = false ) => {
			if ( requireUpgrade ) {
				debug( 'Upgrade required, skipping' );
				return null;
			}

			if ( isImageBusy( block.clientId ) ) {
				debug( 'Already updating alt text, skipping' );
				return null;
			}

			if ( hasImageFailed( block.clientId ) ) {
				debug( 'Image failed, skipping' );
				return null;
			}

			try {
				setImageBusy( block.clientId, true );
				dequeueAsyncRequest();

				const response = await request( 'images-alt-text', block, useBase64Image );

				increaseRequestsCount();

				const altText = parseResponse( response ).texts?.[ 0 ];

				await updateBlockAttributes( block.clientId, { alt: altText } );
				setImageBusy( block.clientId, false );

				return true;
			} catch ( error ) {
				setImageBusy( block.clientId, false );

				// If the image URL is invalid, try again with a base64 image.
				if ( error?.message.includes( 'The image URL is invalid' ) && ! useBase64Image ) {
					debug( 'Retrying with base64 image' );
					return updateAltText( block, true );
				}

				if ( error?.code !== 'fetch_error' ) {
					setImageFailed( block.clientId, true );
				}
				debug( 'Error updating alt text', error );
				return false;
			}
		},
		[
			requireUpgrade,
			isImageBusy,
			hasImageFailed,
			setImageBusy,
			dequeueAsyncRequest,
			request,
			increaseRequestsCount,
			updateBlockAttributes,
			setImageFailed,
		]
	);

	const updateAltTexts = useCallback(
		async ( force: boolean = false ) => {
			const imageBlocks = getAllBlocks().filter( block => block.name === 'core/image' );
			const imageBlocksWithoutAltText = imageBlocks.filter( block => ! block.attributes.alt );
			const blocks = force ? imageBlocks : imageBlocksWithoutAltText;

			const promises = blocks.map( async block => {
				return await updateAltText( block );
			} );

			return await Promise.all( promises );
		},
		[ updateAltText ]
	);

	const updateSeoData = useCallback( async () => {
		const promises = [];
		setBusy( true );

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

		const result = ( await Promise.all( promises ) ).flat();
		setBusy( false );

		// The notice is only shown if at least one value was updated
		if ( result.some( value => value === true ) ) {
			createInfoNotice( __( 'SEO metadata added', 'jetpack' ), { type: 'snackbar' } );
		}
	}, [ setBusy, features, createInfoNotice, updateTitle, updateDescription, updateAltTexts ] );

	return { updateSeoData, updateAltText, isBusy };
};
