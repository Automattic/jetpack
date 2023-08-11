import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { LoomIcon } from '../../shared/icons';

/*
 * New `core/embed` block variation.
 */
const coreEmbedVariation = {
	name: 'loom',
	title: 'Loom',
	icon: LoomIcon,
	keywords: [ __( 'video', 'jetpack' ) ],
	description: __( 'Embed a Loom video.', 'jetpack' ),
	patterns: [ /^https?:\/\/(www\.)?loom\.com\/share\/.+/i ],
	attributes: { providerNameSlug: 'loom', responsive: true },
};
registerBlockVariation( 'core/embed', coreEmbedVariation );
