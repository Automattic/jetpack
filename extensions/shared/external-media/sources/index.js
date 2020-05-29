/**
 * WordPress dependencies
 */

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PexelsIcon } from '../../icons';
import PexelsMedia from './pexels';
import { SOURCE_WORDPRESS, SOURCE_PEXELS } from '../constants';

export const mediaSources = [
	{
		id: SOURCE_PEXELS,
		label: __( 'Pexels Free Photos', 'jetpack' ),
		icon: <PexelsIcon />,
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
	 * shouldn't be shown). The docs say it should be strictly boolean, hence the
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
	switch ( type ) {
		case SOURCE_PEXELS:
			return PexelsMedia;

		default:
			return null;
	}
}

export function getExternalSource( type ) {
	return mediaSources.find( item => item.id === type );
}
