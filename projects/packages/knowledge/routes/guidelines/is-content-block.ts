import { getBlockType } from '@wordpress/blocks';

// Gutenberg keeps this predicate private; use the same logic with the public registry.
/**
 * Match Gutenberg content-role detection through the public block registry.
 *
 * @param name - Registered block name.
 * @return Whether the block carries content.
 */
export function isContentBlock( name: string ): boolean {
	const blockType = getBlockType( name );
	const attributes = blockType?.attributes;
	// Not all blocks have attributes but they may support contentRole instead.
	const supportsContentRole = ( blockType?.supports as Record< string, unknown > )?.contentRole;

	if ( supportsContentRole ) {
		return true;
	}
	if ( ! attributes ) {
		return false;
	}

	return !! Object.keys( attributes )?.some( attributeKey => {
		const attribute = attributes[ attributeKey ];
		return attribute?.role === 'content' || attribute?.__experimentalRole === 'content';
	} );
}
