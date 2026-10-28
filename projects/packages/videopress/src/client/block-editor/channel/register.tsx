/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../blocks/video/components/icons';
/**
 * Types
 */
import type { BlockConfiguration, BlockEditProps } from '@wordpress/blocks';
import type { ComponentType } from 'react';

/**
 * Register a server-rendered channel block from its metadata.
 *
 * @param metadata            - The block.json contents.
 * @param metadata.name       - Block name.
 * @param metadata.title      - Block title.
 * @param metadata.category   - Block category.
 * @param metadata.attributes - Attribute definitions.
 * @param edit                - Edit component.
 */
export default function registerChannelBlock< T extends Record< string, unknown > >(
	metadata: { name: string; title: string; category: string; attributes: unknown },
	edit: ComponentType< BlockEditProps< T > >
) {
	registerBlockType< T >( metadata.name, {
		title: metadata.title,
		category: metadata.category,
		attributes: metadata.attributes as BlockConfiguration< T >[ 'attributes' ],
		icon,
		edit,
		// Dynamic block: the markup comes from Channel_Blocks on the server.
		save: () => null,
	} );
}
