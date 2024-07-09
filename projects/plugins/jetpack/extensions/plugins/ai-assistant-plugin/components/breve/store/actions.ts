/**
 * External dependencies
 */
import { dispatch, select } from '@wordpress/data';
import {
	create,
	getActiveFormat,
	getTextContent,
	removeFormat,
	toHTMLString,
} from '@wordpress/rich-text';
/**
 * Internal dependencies
 */
import features from '../features';
import registerEvents from '../features/events';
import highlight from '../highlight/highlight';

// HELPERS

const canHighlightBlock = block => {
	const allowedBlocks = [ 'core/paragraph' ];
	return allowedBlocks.includes( block.name );
};

const getBlockRichText = block => {
	return typeof block.attributes.content === 'string'
		? create( { html: block.attributes.content } )
		: create( block.attributes.content );
};

const hasHighlight = block => {
	return features.some( feature => {
		const type = `jetpack/ai-proofread-${ feature.config.name }`;
		const content = getBlockRichText( block );
		return Boolean( getActiveFormat( content, type ) );
	} );
};

const formatBlock = ( block, format ) => {
	const currentContent = getBlockRichText( block );
	const currentText = getTextContent( currentContent );

	const newContent = features.reduce(
		( acc, feature ) => {
			const type = `jetpack/ai-proofread-${ feature.config.name }`;
			return format( {
				type,
				content: acc,
				feature,
			} );
		},
		// We started with a fresh text
		create( { text: currentText } )
	);

	if ( newContent ) {
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		const attributes = { content: toHTMLString( { value: newContent } ) };
		updateBlockAttributes( block.clientId, attributes );
	}
};

const highlightBlock = block => {
	formatBlock( block, ( { type, content, feature } ) => {
		return highlight( {
			content,
			indexes: feature.highlight( getTextContent( content ) ),
			type,
			attributes: { 'data-type': feature.config.name },
		} );
	} );
};

const removeHighlightBlock = block => {
	formatBlock( block, ( { type, content } ) => {
		return removeFormat( content, type, 0, getTextContent( content ).length );
	} );
};

// ACTIONS

export function setHighlightHover( isHover ) {
	return {
		type: 'SET_HIGHLIGHT_HOVER',
		isHover,
	};
}

export function setPopoverHover( isHover ) {
	return {
		type: 'SET_POPOVER_HOVER',
		isHover,
	};
}

export function setPopoverAnchor( anchor ) {
	return {
		type: 'SET_POPOVER_ANCHOR',
		anchor,
	};
}

export function toggleProofread( force?: boolean ) {
	const current = select( 'jetpack/ai-breve' ).isProofreadEnabled();
	const enabled = force === undefined ? ! current : force;
	return {
		type: 'SET_PROOFREAD_ENABLED',
		enabled,
	};
}

export function setBlockHighlight( block ) {
	return ( { dispatch: dispatchFromThunk } ) => {
		const { isProofreadEnabled, getBlocksContent } = select( 'jetpack/ai-breve' );

		if ( canHighlightBlock( block ) && isProofreadEnabled() ) {
			const blocks = getBlocksContent();
			const blockIndex = blocks.findIndex( b => b.clientId === block.clientId );
			const savedText = blocks[ blockIndex ]?.text ?? '';

			const currentContent = getBlockRichText( block );
			const currentText = getTextContent( currentContent );

			const changed = currentText !== savedText;

			if ( changed && currentText ) {
				highlightBlock( block );

				// We need to wait for the highlights to be applied before we can attach events
				setTimeout( () => {
					registerEvents( block.clientId );
				}, 500 );

				dispatchFromThunk( {
					type: 'SET_BLOCK_TEXT',
					clientId: block.clientId,
					text: currentText,
					index: blockIndex === -1 ? undefined : blockIndex,
				} );
			}
		} else if ( hasHighlight( block ) ) {
			removeHighlightBlock( block );
		}
	};
}
