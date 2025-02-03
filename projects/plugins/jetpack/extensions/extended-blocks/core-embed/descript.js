import { DescriptIcon } from '@automattic/jetpack-shared-extension-utils/icons';
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/*
 * New `core/embed` block variation.
 */
const coreEmbedVariationDescript = {
	name: 'descript',
	title: 'Descript',
	icon: DescriptIcon,
	keywords: [ __( 'descript', 'jetpack' ) ],
	description: __( 'Embed a Descript Item.', 'jetpack' ),
	patterns: [ /^https:\/\/share.descript.com\/(view|embed)\/\w+/i ],
	attributes: { providerNameSlug: 'descript', responsive: true },
};

registerBlockVariation( 'core/embed', coreEmbedVariationDescript );
