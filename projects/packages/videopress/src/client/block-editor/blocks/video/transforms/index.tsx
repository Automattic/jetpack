/**
 * External dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { buildVideoPressURL, pickGUIDFromUrl } from '../../../../lib/url';
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

const transformToCoreEmbed = {
	type: 'block',
	blocks: [ 'core/embed' ],
	isMatch: ( attrs: VideoBlockAttributes ) => attrs?.src || attrs?.guid,
	transform: ( attrs: VideoBlockAttributes ) => {
		const { updateBlockAttributes } = dispatch( blockEditorStore );
		const { getBlockAttributes } = select( blockEditorStore );
		const { guid, src: srcFromAttr, className } = attrs;

		// Build the source (URL) in case it isn't defined.
		const { url } = buildVideoPressURL( guid );

		const src = srcFromAttr || url;
		if ( ! src ) {
			return createBlock( 'core/embed' );
		}

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
			const updatedClassName = classnames( className, embedClassName );
			updateBlockAttributes( clientId, { className: updatedClassName } );
		}, 100 );

		return block;
	},
};

const from = [ transformFromCoreEmbed ];
const to = [ transformToCoreEmbed ];

export default { from, to };
