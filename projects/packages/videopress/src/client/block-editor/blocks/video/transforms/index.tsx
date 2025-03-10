/**
 * External dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, findTransform, getBlockTransforms } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import {
	buildVideoPressURL,
	isVideoPressUrl,
	pickGUIDFromUrl,
	pickVideoBlockAttributesFromUrl,
} from '../../../../lib/url';
/**
 * Types
 */
import { isVideoFile } from '../../../utils/video';
import { CoreEmbedVideoPressVariationBlockAttributes, VideoBlockAttributes } from '../types';

const transformFromCoreEmbed = {
	type: 'block',
	blocks: [ 'core/embed' ],
	isMatch: ( attrs: CoreEmbedVideoPressVariationBlockAttributes ) =>
		attrs.providerNameSlug === 'videopress' && pickGUIDFromUrl( attrs?.url ),
	transform: ( attrs: CoreEmbedVideoPressVariationBlockAttributes ) => {
		const { url: src, providerNameSlug } = attrs;
		const guid = pickGUIDFromUrl( src );

		/*
		 * Don't transform when the block
		 * is not a core/embed VideoPress block variation
		 */
		const isCoreEmbedVideoPressVariation = providerNameSlug === 'videopress' && !! guid;
		if ( ! isCoreEmbedVideoPressVariation ) {
			return createBlock( 'core/embed', attrs );
		}

		/*
		 * Force className cleanup.
		 * It adds aspect ratio classes when transforming from embed block.
		 */
		const classRegex = /(wp-embed-aspect-\d+-\d+)|(wp-has-aspect-ratio)/g;
		attrs.className = attrs.className?.replace( classRegex, '' ).trim();

		return createBlock( 'videopress/video', { guid, src } );
	},
};

const transformFromFile = {
	type: 'files',
	// Check if the files array contains a video file.
	isMatch: files => {
		if ( ! files || ! files.length ) {
			return false;
		}

		return files.some( isVideoFile );
	},

	priority: 8, // higher priority (lower number) than v5's core/video transform (9).
	transform: ( files: File[] ) => {
		const fromTransforms = getBlockTransforms( 'from' );

		// Categorize and process files while preserving their original order.
		const blocks = files.flatMap( file => {
			// Transform video files into 'videopress/video' blocks.
			if ( isVideoFile( file ) ) {
				return createBlock( 'videopress/video', { src: createBlobURL( file ) } );
			}

			// Find a matching transform for non-video files.
			const transformation = findTransform(
				fromTransforms,
				transform => transform.type === 'files' && transform.isMatch( [ file ] )
			);

			// If a transform exists, apply it; otherwise, return an empty array.
			return transformation ? transformation.transform( [ file ] ) : [];
		} );

		// Return all generated blocks (video + non-video) in the original file order.
		return blocks;
	},
};

const transformToCoreEmbed = {
	type: 'block',
	blocks: [ 'core/embed' ],
	isMatch: ( attrs: VideoBlockAttributes ) => attrs?.src || attrs?.guid,
	transform: ( attrs: VideoBlockAttributes ) => {
		const { guid, src: srcFromAttr, className } = attrs;

		// Build the source (URL) in case it isn't defined.
		const { url } = buildVideoPressURL( guid );

		const src = srcFromAttr || url;
		if ( ! src ) {
			return createBlock( 'core/embed' );
		}

		const { updateBlockAttributes } = dispatch( blockEditorStore );
		const { getBlockAttributes } = select( blockEditorStore );

		const block = createBlock( 'core/embed', {
			allowResponsive: true,
			providerNameSlug: 'videopress',
			responsive: true,
			type: 'video',
			url,
		} );

		/*
		 * Hack: It seems that core doesn't allow setting the className
		 * attribute when creating a block.
		 * So, we need to wait for the block to be created
		 * and then update the className attribute, asynchronously.
		 */
		const { clientId } = block;
		setTimeout( () => {
			const { className: embedClassName } = getBlockAttributes( clientId ) || {};
			const updatedClassName = clsx( className, embedClassName );
			updateBlockAttributes( clientId, { className: updatedClassName } );
		}, 100 );

		return block;
	},
};

const transformFromPastingVideoPressURL = {
	type: 'raw',
	isMatch: ( node: HTMLDivElement ) => {
		const { textContent } = node;
		if ( ! textContent ) {
			return false;
		}

		return isVideoPressUrl( textContent.trim() );
	},
	transform: ( node: HTMLDivElement ) => {
		const { textContent } = node;
		if ( ! textContent ) {
			return false;
		}

		const url = textContent.trim();
		const guid = pickGUIDFromUrl( url );
		if ( ! guid ) {
			return false;
		}

		const attrs = pickVideoBlockAttributesFromUrl( url );
		return createBlock( 'videopress/video', { guid, ...attrs } );
	},
};

const from = [ transformFromFile, transformFromCoreEmbed, transformFromPastingVideoPressURL ];
const to = [ transformToCoreEmbed ];

export default { from, to };
