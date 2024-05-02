import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { __ } from '@wordpress/i18n';
import { GooglePhotosIcon, OpenverseIcon, PexelsIcon, JetpackMobileAppIcon } from '../../icons';
import {
	SOURCE_WORDPRESS,
	SOURCE_GOOGLE_PHOTOS,
	SOURCE_OPENVERSE,
	SOURCE_PEXELS,
	SOURCE_JETPACK_APP_MEDIA,
	SOURCE_JETPACK_AI_FEATURED_IMAGE,
} from '../constants';
import GooglePhotosMedia from './google-photos';
import JetpackAIFeaturedImage from './jetpack-ai-featured-image';
import JetpackAppMedia from './jetpack-app-media';
import OpenverseMedia from './openverse';
import PexelsMedia from './pexels';

export const internalMediaSources = [
	{
		id: SOURCE_JETPACK_APP_MEDIA,
		label: __( 'Your Phone', 'jetpack' ),
		icon: <JetpackMobileAppIcon className="components-menu-items__item-icon" />,
		keyword: 'jetpack mobile app',
	},
];

export const featuredImageExclusiveMediaSources = [
	{
		id: SOURCE_JETPACK_AI_FEATURED_IMAGE,
		label: __( 'AI Generated Image', 'jetpack' ),
		icon: aiAssistantIcon,
		keyword: 'jetpack ai',
	},
];

export const externalMediaSources = [
	{
		id: SOURCE_GOOGLE_PHOTOS,
		label: __( 'Google Photos', 'jetpack' ),
		icon: <GooglePhotosIcon className="components-menu-items__item-icon" />,
		keyword: 'google photos',
	},
	{
		id: SOURCE_PEXELS,
		label: __( 'Pexels Free Photos', 'jetpack' ),
		icon: <PexelsIcon className="components-menu-items__item-icon" />,
		keyword: 'pexels',
	},
	{
		id: SOURCE_OPENVERSE,
		label: __( 'Openverse', 'jetpack' ),
		icon: <OpenverseIcon className="components-menu-items__item-icon" />,
		keyword: 'openverse',
	},
];

export const mediaSources = externalMediaSources.concat( internalMediaSources );

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
	}
	return null;
}

export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
