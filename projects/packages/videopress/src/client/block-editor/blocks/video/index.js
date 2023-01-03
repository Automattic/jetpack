/**
 * WordPress dependencies
 */
import { registerBlockType, createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { getVideoPressUrl, pickGUIDFromUrl } from '../../../lib/url';
import metadata from './block.json';
import { VideoPressIcon as icon } from './components/icons';
import Edit from './edit';
import save from './save';
import videoPressBlockExampleImage from './videopress-block-example-image.jpg';
import './style.scss';

export const { name, title, description } = metadata;

registerBlockType( name, {
	edit: Edit,
	save,
	icon,
	example: {
		attributes: {
			src: videoPressBlockExampleImage,
			isExample: true,
		},
	},
	transforms: {
		from: [
			{
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
			},
		],
		to: [
			{
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
			},
		],
	},
} );
