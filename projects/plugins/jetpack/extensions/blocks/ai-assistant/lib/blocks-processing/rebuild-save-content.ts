/**
 * External dependencies
 */
import { getBlockAttributes, getSaveContent } from '@wordpress/blocks';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { comments as columnComments } from './column/comments';
import { comments as coverComments } from './cover/comments';

const debug = debugFactory( 'jetpack-ai-assistant:block-processing' );

const getComments = ( block, attributes? ) => {
	const defaultTag = block.name.replace( '/', ':' ).replace( /^core:/, 'wp:' );

	switch ( block.name ) {
		case 'core/cover':
			return coverComments( block, attributes );
		case 'core/column':
			return columnComments( block, attributes );
		default:
			return {
				open: `<!-- ${ defaultTag } -->`,
				close: `<!-- /${ defaultTag } -->`,
			};
	}
};

export const rebuildSaveContent = block => {
	const rebuiltAttributes = getBlockAttributes( block.name, block.originalContent );
	const { open: openOriginal, close } = getComments( block );
	const { open: openRebuilt } = getComments( block, rebuiltAttributes );

	const getContent = ( attributes, openComment ) => {
		return `${ openComment }${ getSaveContent(
			block.name,
			attributes,
			block.innerBlocks
		) }${ close }`;
	};

	const rebuiltContentOriginalAttributes = getContent( block.attributes, openOriginal );
	const rebuiltContentNewAttributes = getContent( rebuiltAttributes, openRebuilt );

	debug( 'Rebuilt content with original attributes: %o', rebuiltContentOriginalAttributes );
	debug( 'Rebuilt content with new attributes: %o', rebuiltContentNewAttributes );
	return { rebuiltContentOriginalAttributes, rebuiltContentNewAttributes };
};
