/**
 * The code below is pulled from Gutenberg embed block, until we can use it directly from Gutenberg
 * https://github.com/WordPress/gutenberg/blob/e4b6d70f129a745a0cc7dc556d41a44bdab7b0ca/packages/block-library/src/embed/util.js#L177
 */
import { createBlock, getBlockType } from '@wordpress/blocks';
import clsx from 'clsx';
import { ASPECT_RATIOS, DEFAULT_EMBED_BLOCK } from './constants';

/**
 * Removes all previously set aspect ratio related classes and return the rest
 * existing class names.
 *
 * @param {string} existingClassNames - Any existing class names.
 * @returns {string} The class names without any aspect ratio related class.
 */
export const removeAspectRatioClasses = existingClassNames => {
	const aspectRatioClassNames = ASPECT_RATIOS.reduce(
		( accumulator, { className } ) => {
			accumulator[ className ] = false;
			return accumulator;
		},
		{ 'wp-has-aspect-ratio': false }
	);
	return clsx( existingClassNames, aspectRatioClassNames );
};

/**
 * Returns class names with any relevant responsive aspect ratio names.
 *
 * @param {string}  html               - The preview HTML that possibly contains an iframe with width and height set.
 * @param {string}  existingClassNames - Any existing class names.
 * @param {boolean} allowResponsive    - If the responsive class names should be added, or removed.
 * @returns {string} Deduped class names.
 */
export function getClassNames( html, existingClassNames = '', allowResponsive = true ) {
	if ( ! allowResponsive ) {
		return removeAspectRatioClasses( existingClassNames );
	}

	const previewDocument = document.implementation.createHTMLDocument( '' );
	previewDocument.body.innerHTML = html;
	const iframe = previewDocument.body.querySelector( 'iframe' );

	// If we have a fixed aspect iframe, and it's a responsive embed block.
	if ( iframe && iframe.height && iframe.width ) {
		const aspectRatio = ( iframe.width / iframe.height ).toFixed( 2 );
		// Given the actual aspect ratio, find the widest ratio to support it.
		for ( let ratioIndex = 0; ratioIndex < ASPECT_RATIOS.length; ratioIndex++ ) {
			const potentialRatio = ASPECT_RATIOS[ ratioIndex ];

			if ( aspectRatio >= potentialRatio.ratio ) {
				return clsx(
					removeAspectRatioClasses( existingClassNames ),
					potentialRatio.className,
					'wp-has-aspect-ratio'
				);
			}
		}
	}

	return existingClassNames;
}

export const removeFileNameExtension = name => {
	return name.replace( /\.[^/.]+$/, '' );
};

export const pickGUIDFromUrl = url => {
	if ( ! url || typeof url !== 'string' ) {
		return null;
	}

	const urlParts = url.match(
		/^https?:\/\/(?<host>video(?:\.word|s\.files\.word)?press\.com)(?:\/v|\/embed)?\/(?<guid>[a-zA-Z\d]{8})/
	);

	if ( ! urlParts?.groups?.guid ) {
		return null;
	}

	return urlParts.groups.guid;
};

/**
 * Check whether a block is a VideoPress block instance,
 * based on the passed attributes.
 *
 * @param {object} attributes - Block attributes.
 * @returns {boolean} 	        Whether the block is a VideoPress block instance.
 */
export const isVideoPressBlockBasedOnAttributes = attributes => {
	const { guid, videoPressTracks, isVideoPressExample } = attributes;

	// VideoPress block should have a guid attribute.
	if ( ! guid?.length ) {
		return false;
	}

	// VideoPress block should have a videoPressTracks array attribute.
	if ( ! Array.isArray( videoPressTracks ) ) {
		return false;
	}

	// VideoPress block should have a isVideoPressExample boolean attribute.
	const attrNames = Object.keys( attributes );
	if ( ! attrNames.includes( 'isVideoPressExample' ) || typeof isVideoPressExample !== 'boolean' ) {
		return false;
	}

	return true;
};

/**
 * Creates an embed block if a VideoPress URL is passed.
 *
 * @param {object} props - The block's props.
 * @returns {object|undefined} The embed block, if appropriate.
 */
export const createVideoPressEmbedBlock = props => {
	const { attributes = {} } = props;
	const { url, ...restAttributes } = attributes;

	if ( ! url || ! getBlockType( DEFAULT_EMBED_BLOCK ) ) {
		return;
	}

	const isVideoPress = /^https?:\/\/videopress\.com\/.+/i.test( url );

	if ( isVideoPress ) {
		const matchedAttributes = {
			providerNameSlug: 'videopress',
			responsive: true,
		};

		return createBlock( DEFAULT_EMBED_BLOCK, {
			url,
			...restAttributes,
			...matchedAttributes,
		} );
	}
};
