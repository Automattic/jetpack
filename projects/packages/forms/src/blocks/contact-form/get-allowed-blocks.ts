import { CORE_BLOCKS } from '../shared/util/constants.js';
import { childBlocks } from './child-blocks.js';

export function getAllowedBlocks(): string[] {
	const allowedBlocks: string[] = [];
	for ( const childBlock of childBlocks ) {
		allowedBlocks.push( `jetpack/${ childBlock.name }` );
	}
	return allowedBlocks.concat( CORE_BLOCKS );
}
