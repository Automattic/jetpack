/**
 * WordPress dependencies
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { LoomIcon } from '../../shared/icons';

/*
 * The `core/embed` block started using block variations in WP 5.5.
 * For previous WP versions, it implements a fallback process
 * extending the block via the filter
 * by which populates the variations array with the Loom variation.
 */
const coreEmbedVariation = {
	name: 'loom',
	title: 'Loom',
	icon: LoomIcon,
	keywords: [ __( 'video' ) ],
	description: __( 'Embed a Loom video.' ),
	patterns: [ /^https?:\/\/(www\.)?loom\.com\/share\/.+/i ],
	attributes: { providerNameSlug: 'loom', responsive: true },
};

if ( typeof registerBlockVariation !== undefined ) {
	// WP version >= 5.5.
	registerBlockVariation( 'core/embed', coreEmbedVariation );
} else {
	// WP version < 5.5.
	const boundFunction = ( settings, name ) => {
		if ( name === 'core/embed' && settings?.variations?.length ) {
			settings.variations = [ ...settings.variations, coreEmbedVariation ];
		}
		return settings;
	};

	addFilter( 'blocks.registerBlockType', 'namespace/identifier', boundFunction );
}
