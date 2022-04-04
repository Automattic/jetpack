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

const isPocketCastsEnabled = !! window?.Jetpack_Editor_Initial_State.jetpack?.pocket_casts_enabled;

if ( isPocketCastsEnabled ) {
	registerBlockVariation( 'core/embed', coreEmbedVariationPocketCasts );
}
