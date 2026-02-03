import { childBlocks } from '../../blocks/contact-form/child-blocks.js';
import { CORE_BLOCKS } from '../../blocks/shared/util/constants.js';

/**
 * Get the list of allowed blocks in the form editor.
 *
 * @return {string[]} Array of allowed block names.
 */
export function getAllowedBlocks(): string[] {
	const allowedBlocks: string[] = [];
	for ( const childBlock of childBlocks ) {
		allowedBlocks.push( `jetpack/${ childBlock.name }` );
	}
	return allowedBlocks.concat( CORE_BLOCKS );
}
