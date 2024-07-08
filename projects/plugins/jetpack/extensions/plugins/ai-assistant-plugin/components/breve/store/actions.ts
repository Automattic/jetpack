/**
 * Internal dependencies
 */
import { create, getTextContent, toHTMLString } from '@wordpress/rich-text';
import features from '../features';
import highlight from '../highlight/highlight';

export function setPopoverState( isOpen ) {
	return {
		type: 'SET_POPOVER_STATE',
		isOpen,
	};
}

export function setBlockText( block ) {
	return {
		type: 'SET_BLOCK_TEXT',
		clientId: block.clientId,
		text: block.text,
		index: block.index,
	};
}

export function setBlockContent( clientId ) {
	return ( { registry: { select, dispatch: dispatchFromRegistry }, dispatch } ) => {
		const block = select( 'core/block-editor' ).getBlock( clientId );
		const blocks = select( 'jetpack/ai-breve' ).getBlocksContent();
		const blockIndex = blocks.findIndex( b => b.clientId === clientId );
		const savedText = blocks[ blockIndex ]?.text ?? '';

		const currentContent =
			typeof block.attributes.content === 'string'
				? create( { html: block.attributes.content } )
				: create( block.attributes.content );

		const currentText = getTextContent( currentContent );
		const changed = currentText !== savedText;

		if ( changed && currentText ) {
			const newContent = features.reduce(
				( acc, feature ) => {
					return highlight( {
						content: acc,
						indexes: feature.highlight( getTextContent( acc ) ),
						type: `jetpack/ai-proofread-${ feature.config.name }`,
						attributes: { 'data-type': feature.config.name },
					} );
				},
				// We started with a fresh text
				create( { text: currentText } )
			);

			if ( newContent ) {
				const updateBlockAttributes =
					dispatchFromRegistry( 'core/block-editor' ).updateBlockAttributes;

				updateBlockAttributes( clientId, { content: toHTMLString( { value: newContent } ) } );
				features.forEach( feature => {
					// We need to wait for the highlights to be applied before we can attach events
					setTimeout( () => {
						feature.events();
					}, 2000 );
				} );

				dispatch( {
					type: 'SET_BLOCK_TEXT',
					clientId: block.clientId,
					text: currentText,
					index: blockIndex === -1 ? undefined : blockIndex,
				} );
			}
		}
	};
}
