/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GooglePhotosIcon, PexelsIcon } from '../../icons';
import GooglePhotosMedia from './google-photos';
import PexelsMedia from './pexels';
import { SOURCE_WORDPRESS, SOURCE_GOOGLE_PHOTOS, SOURCE_PEXELS } from '../constants';

export const mediaSources = [
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
];

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
	}

	return null;
}

export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
