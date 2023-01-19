/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { getVideoPressUrl, pickGUIDFromUrl } from '../../../../lib/url';

const transfromFromCoreEmbed = {
	type: 'block',
	blocks: [ 'core/embed' ],
	isMatch: attrs => attrs.providerNameSlug === 'videopress' && pickGUIDFromUrl( attrs?.url ),
	transform: attrs => {
		const { url, providerNameSlug } = attrs;
		const guid = pickGUIDFromUrl( url );
		const isCoreEmbedVideoPressVariation = providerNameSlug === 'videopress' && !! guid;

		/*
		 * Do not add transform when the block
		 * is not a core/embed VideoPress block variation
		 */
		if ( ! isCoreEmbedVideoPressVariation ) {
			return createBlock( 'core/embed', attrs );
		}

		return createBlock( 'videopress/video', { ...attrs, guid, src: url } );
	},
};

const transfromToCoreEmbed = {
	type: 'block',
	blocks: [ 'core/embed' ],
	isMatch: attrs => attrs?.src || getVideoPressUrl( attrs?.guid, attrs ),
	transform: attrs => {
		const { guid, src } = attrs;

		// Build the source (URL) in case it isn't defined.
		const url = src || getVideoPressUrl( guid, attrs );
		if ( ! url ) {
			return createBlock( 'core/embed' );
		}

		return createBlock( 'core/embed', { ...attrs, url } );
	},
};

const from = [ transfromFromCoreEmbed ];
const to = [ transfromToCoreEmbed ];

export default { from, to };
