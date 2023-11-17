import { __ } from '@wordpress/i18n';
import variations from './variations';

/**
 * Retrieves the social service's icon component.
 *
 * @param {string} name - key for a social service (lowercase slug)
 *
 * @returns {object} Icon component for social service.
 */
export const getIconBySite = name => {
	const variation = variations.find( v => v.name === name );
	return variation ? variation.icon : null;
};

/**
 * Retrieves the display name for the social service.
 *
 * @param {string} name - key for a social service (lowercase slug)
 *
 * @returns {string} Display name for social service
 */
export const getNameBySite = name => {
	const variation = variations.find( v => v.name === name );
	return variation ? variation.title : __( 'Social Icon', 'jetpack' );
};
