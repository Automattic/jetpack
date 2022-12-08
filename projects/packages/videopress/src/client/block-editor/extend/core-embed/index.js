/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { unregisterBlockVariation } from '@wordpress/blocks';
import domReady from '@wordpress/dom-ready';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import withCoreEmbedVideoPressBlock from './edit';

const extendCoreEmbedVideoPressBlock = ( settings, name ) => {
	if ( isSimpleSite() ) {
		return settings;
	}

	if ( name !== 'core/embed' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			keepUsingOEmbedVariation: {
				type: 'boolean',
			},
		},
		edit: withCoreEmbedVideoPressBlock( settings.edit ),
	};
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-embed/handle-representation',
	extendCoreEmbedVideoPressBlock
);

domReady( function () {
	// @todo: horrible hack to make the unregister work
	setTimeout( () => {
		unregisterBlockVariation( 'core/embed', 'videopress' );
	}, 0 );
} );
