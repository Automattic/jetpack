/**
 * WordPress dependencies
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PocketCastsIcon } from '../../shared/icons';

/*
 * Pocket Casts `core/embed` block variation.
 */
const coreEmbedVariationPocketCasts = {
	name: 'pocketcasts',
	title: 'Pocket Casts',
	icon: PocketCastsIcon,
	keywords: [ __( 'pocketcasts', 'jetpack' ), __( 'podcast', 'jetpack' ) ],
	description: __( 'Embed a Pocket Casts Player.', 'jetpack' ),
	patterns: [ /^https:\/\/pca.st\/\w+/i ],
	attributes: { providerNameSlug: 'pocketcasts', responsive: true },
};

registerBlockVariation( 'core/embed', coreEmbedVariationPocketCasts );

// Deliberately export name, title & empty settings object so we don't break `getExtensions`
// but we also don't want to register any new plugin or block.
export const name = 'pocketcasts';
export const title = __( 'Pocket Casts', 'jetpack' );
export const settings = {};
