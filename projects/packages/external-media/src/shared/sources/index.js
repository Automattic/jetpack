import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import {
	GooglePhotosIcon,
	OpenverseIcon,
	PexelsIcon,
	JetpackMobileAppIcon,
} from '@automattic/jetpack-shared-extension-utils/icons';
import { __ } from '@wordpress/i18n';
import React from 'react';
import {
	SOURCE_WORDPRESS,
	SOURCE_GOOGLE_PHOTOS,
	SOURCE_OPENVERSE,
	SOURCE_PEXELS,
	SOURCE_JETPACK_APP_MEDIA,
	SOURCE_JETPACK_AI_FEATURED_IMAGE,
	SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_MEDIA_SOURCE,
	SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK,
} from '../constants';
import GooglePhotosMedia from './google-photos';
import JetpackAIFeaturedImage from './jetpack-ai-featured-image';
import JetpackAIGeneralPurposeImageForBlock from './jetpack-ai-general-purpose-image-for-block';
import JetpackAIGeneralPurposeImageForMediaSource from './jetpack-ai-general-purpose-image-for-media-source';
import JetpackAppMedia from './jetpack-app-media';
import OpenverseMedia from './openverse';
import PexelsMedia from './pexels';

export const internalMediaSources = [
	{
		id: SOURCE_JETPACK_APP_MEDIA,
		label: __( 'Your Phone', 'jetpack-external-media' ),
		icon: <JetpackMobileAppIcon className="components-menu-items__item-icon" />,
		keyword: 'jetpack mobile app',
	},
];

/**
 * Used when the context is for a featured image.
 */
export const featuredImageExclusiveMediaSources = [
	{
		id: SOURCE_JETPACK_AI_FEATURED_IMAGE,
		label: __( 'Generate with AI', 'jetpack-external-media' ),
		icon: aiAssistantIcon,
		keyword: 'jetpack ai',
	},
];

/**
 * Used when the context is not the featured image, but a general purpose image.
 */
export const generalPurposeImageExclusiveMediaSources = [
	{
		id: SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_MEDIA_SOURCE,
		label: __( 'Generate with AI', 'jetpack-external-media' ),
		icon: aiAssistantIcon,
		keyword: 'jetpack ai',
	},
];

export const externalMediaSources = [
	{
		id: SOURCE_GOOGLE_PHOTOS,
		label: __( 'Google Photos', 'jetpack-external-media' ),
		icon: <GooglePhotosIcon className="components-menu-items__item-icon" />,
		keyword: 'google photos',
	},
	{
		id: SOURCE_PEXELS,
		label: __( 'Pexels free photos', 'jetpack-external-media' ),
		icon: <PexelsIcon className="components-menu-items__item-icon" />,
		keyword: 'pexels',
	},
	{
		id: SOURCE_OPENVERSE,
		label: __( 'Openverse', 'jetpack-external-media' ),
		icon: <OpenverseIcon className="components-menu-items__item-icon" />,
		keyword: 'openverse',
	},
];

export const mediaSources = externalMediaSources.concat( internalMediaSources );

/**
 * Whether we can display the placeholder
 * @param {object} props - The properties.
 * @return {boolean} True if we can display the placeholder, otherwise false.
 */
export function canDisplayPlaceholder( props ) {
	const { disableMediaButtons, dropZoneUIOnly } = props;

	// Deprecated. May still be used somewhere
	if ( dropZoneUIOnly === true ) {
		return false;
	}

	/**
	 * This is a new prop that is false when editing an image (and the placeholder
	 * should be shown), and contains a URL when not editing (and the placeholder
	 * shouldnt be shown). The docs say it should be strictly boolean, hence the
	 * inverse logic.
	 */
	if ( disableMediaButtons !== undefined && disableMediaButtons !== false ) {
		return false;
	}

	if ( props.source === SOURCE_WORDPRESS ) {
		return false;
	}

	return true;
}

/**
 * Get the external library
 * @param {string} type - The type of external sources.
 * @return {React.Component} - The external library.
 */
export function getExternalLibrary( type ) {
	if ( type === SOURCE_PEXELS ) {
		return PexelsMedia;
	} else if ( type === SOURCE_GOOGLE_PHOTOS ) {
		return GooglePhotosMedia;
	} else if ( type === SOURCE_OPENVERSE ) {
		return OpenverseMedia;
	} else if ( type === SOURCE_JETPACK_APP_MEDIA ) {
		return JetpackAppMedia;
	} else if ( type === SOURCE_JETPACK_AI_FEATURED_IMAGE ) {
		return JetpackAIFeaturedImage;
	} else if ( type === SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_MEDIA_SOURCE ) {
		return JetpackAIGeneralPurposeImageForMediaSource;
	} else if ( type === SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK ) {
		return JetpackAIGeneralPurposeImageForBlock;
	}
	return null;
}

/**
 * Get the external source
 * @param {string} type - The type of external sources.
 * @return {object} The external source.
 */
export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
