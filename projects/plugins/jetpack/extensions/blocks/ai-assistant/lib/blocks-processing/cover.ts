/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { fixBlock } from './fix-block';

const debug = debugFactory( 'jetpack-ai-assistant:block-processing' );

export const process = block => {
	const clonedBlock = { ...block };
	const tempContainer = document.createElement( 'div' );
	tempContainer.innerHTML = clonedBlock.originalContent;
	const coverElement = tempContainer.querySelector( '.wp-block-cover' );
	const innerContainer = tempContainer.querySelector( '.wp-block-cover__inner-container' );

	// Block does not have necessary elements
	if ( ! coverElement || ! innerContainer ) {
		debug( 'Cover block does not have necessary elements: %o', clonedBlock );
		return null;
	}

	// Check if the cover block is empty
	if ( ! clonedBlock.innerBlocks.length ) {
		debug( 'Cover block is empty: %o', clonedBlock );
		// Add a paragraph to the inner blocks
		const paragraph = createBlock( 'core/paragraph', {
			align: 'center',
			fontSize: 'large',
			placeholder: 'Write title…',
		} );
		clonedBlock.innerBlocks = [ paragraph ];
	}

	if ( block.isValid ) {
		return clonedBlock;
	}

	debug( 'Cover block is invalid: %o', clonedBlock );

	// Check if the cover block has the hidden span
	const hiddenSpan = tempContainer.querySelector( 'span[aria-hidden="true"]' );
	if ( ! hiddenSpan ) {
		debug( 'Cover block has no hidden span' );
		// Add the hidden span
		const newHiddenSpan = document.createElement( 'span' );
		newHiddenSpan.setAttribute( 'aria-hidden', 'true' );
		newHiddenSpan.setAttribute( 'class', 'wp-block-cover__background has-background-dim' );
		debug( 'Adding hidden span: %o', newHiddenSpan );
		coverElement.prepend( newHiddenSpan );
	}

	clonedBlock.originalContent = tempContainer.innerHTML;

	return fixBlock( clonedBlock );
};
