import { __ } from '@wordpress/i18n';
import { GooglePhotosIcon, OpenverseIcon, PexelsIcon } from '../../icons';
import {
	SOURCE_WORDPRESS,
	SOURCE_GOOGLE_PHOTOS,
	SOURCE_OPENVERSE,
	SOURCE_PEXELS,
} from '../constants';
import GooglePhotosMedia from './google-photos';
import OpenverseMedia from './openverse';
import PexelsMedia from './pexels';

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
	{
		id: SOURCE_OPENVERSE,
		label: __( 'Openverse', 'jetpack' ),
		icon: <OpenverseIcon className="components-menu-items__item-icon" />,
		keyword: 'openverse',
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
	} else if ( type === SOURCE_OPENVERSE ) {
		return OpenverseMedia;
	}

	return null;
}

export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
