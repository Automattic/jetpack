
/**
 * WordPress dependencies
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

if ( typeof registerBlockVariation !== undefined ) {
	registerBlockVariation( 'core/embed', {
		name: 'loom',
		title: 'Loom',
		icon: 'admin-users',
		keywords: [ __( 'video' ) ],
		description: __( 'Embed a Loom video.' ),
		patterns: [ /^https?:\/\/(www\.)?loom\.com\/share\/.+/i ],
		attributes: { providerNameSlug: 'loom', responsive: true },
	} );
}
