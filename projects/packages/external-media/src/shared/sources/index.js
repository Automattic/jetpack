import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import {
	GooglePhotosIcon,
	OpenverseIcon,
	PexelsIcon,
	JetpackMobileAppIcon,
} from '@automattic/jetpack-shared-extension-utils/icons';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
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
import { isGutenbergKit } from '../utils/is-gutenberg-kit';
import GooglePhotosMedia from './google-photos';
import JetpackAIFeaturedImage from './jetpack-ai-featured-image';
import JetpackAIGeneralPurposeImageForBlock from './jetpack-ai-general-purpose-image-for-block';
import JetpackAIGeneralPurposeImageForMediaSource from './jetpack-ai-general-purpose-image-for-media-source';
import JetpackAppMedia from './jetpack-app-media';
import OpenverseMedia from './openverse';
import PexelsMedia from './pexels';

const allInternalMediaSources = [
	{
		id: SOURCE_JETPACK_APP_MEDIA,
		label: __( 'Your Phone', 'jetpack-external-media' ),
		icon: <JetpackMobileAppIcon className="components-menu-items__item-icon" />,
		keyword: 'jetpack mobile app',
	},
];

// Disable SOURCE_JETPACK_APP_MEDIA for GutenbergKit (mobile app) as sourcing
// media from "Your phone" while on a phone is less useful and possibly
// confusing.
export const internalMediaSources = isGutenbergKit() ? [] : allInternalMediaSources;

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
 * @return {import('react').Component} - The external library.
 */
export function getExternalLibrary( type ) {
	let component = null;

	if ( type === SOURCE_PEXELS ) {
		component = PexelsMedia;
	} else if ( type === SOURCE_GOOGLE_PHOTOS ) {
		component = GooglePhotosMedia;
	} else if ( type === SOURCE_OPENVERSE ) {
		component = OpenverseMedia;
	} else if ( type === SOURCE_JETPACK_APP_MEDIA ) {
		component = JetpackAppMedia;
	} else if ( type === SOURCE_JETPACK_AI_FEATURED_IMAGE ) {
		component = JetpackAIFeaturedImage;
	} else if ( type === SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_MEDIA_SOURCE ) {
		component = JetpackAIGeneralPurposeImageForMediaSource;
	} else if ( type === SOURCE_JETPACK_AI_GENERAL_PURPOSE_IMAGE_FOR_BLOCK ) {
		component = JetpackAIGeneralPurposeImageForBlock;
	}

	/**
	 * Filter the external media library component.
	 *
	 * Allows replacing the component rendered for a given external media source type.
	 *
	 * @since $$next-version$$
	 * @module jetpack/external-media
	 * @param {import('react').Component|null} component - The component to render.
	 * @param {string} type - The source type identifier.
	 */
	return applyFilters( 'jetpack.externalMedia.libraryComponent', component, type );
}

/**
 * Get the external source
 * @param {string} type - The type of external sources.
 * @return {object} The external source.
 */
export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
