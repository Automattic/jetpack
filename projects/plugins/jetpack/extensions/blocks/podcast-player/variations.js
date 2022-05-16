/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PocketCastsIcon } from './icons/';
import { getIconColor } from '../../shared/block-icons';

export const PocketCastsBlockVariation = {
	name: 'pocket-casts',
	title: __( 'Pocket Casts Player', 'jetpack' ),
	description: __( 'Pocket casts player block', 'jetpack' ),
	icon: {
		src: PocketCastsIcon,
		foreground: getIconColor(),
	},
	attributes: {
		// Custom colors affects all text colors.
		// Hex colors affects all player button colors.
		customPrimaryColor: '#f44336',
		hexPrimaryColor: '#f44336',
		customSecondaryColor: '#171717',
		hexSecondaryColor: '#171717',
		providerNameSlug: 'pocket-casts',
	},
};
