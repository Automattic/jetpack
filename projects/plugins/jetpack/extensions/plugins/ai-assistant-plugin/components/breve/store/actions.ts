/**
 * Internal dependencies
 */
import { create } from '@wordpress/rich-text';
import features from '../features';
import highlight from '../highlight/highlight';

export function setPopoverState( isOpen ) {
	return {
		type: 'SET_POPOVER_STATE',
		isOpen,
	};
}

export function setBlockContent( block ) {
	return ( { registry: { select } } ) => {
		const blocks = select( 'jetpack/ai-breve' ).getBlocksContent();
		const blockIndex = blocks.findIndex( b => b.clientId === block.clientId );
		const content = create( block.attributes.content );
		const newBlocks = [ ...blocks ];
		const changed = content.text !== newBlocks[ blockIndex ]?.content?.text;

		if ( blockIndex === -1 || changed ) {
			features.forEach( feature => {
				highlight( {
					block: { clientId: block.clientId, content },
					indexes: feature.highlight( content.text ),
					type: `jetpack/ai-proofread-${ feature.config.name }`,
					attributes: { 'data-type': feature.config.name },
				} );

				// We need to wait for the highlights to be applied before we can attach events
				setTimeout( () => {
					feature.events();
				}, 2000 );
			} );

			return {
				type: 'SET_BLOCK_CONTENT',
				clientId: block.clientId,
				content,
			};
		}
	};
}
