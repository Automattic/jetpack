/**
 * External
 */
import { parse, serialize } from '@wordpress/blocks';
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal
 */
import { compareBlocks } from '../../lib/utils/compare-blocks';
import { fixIncompleteHTML } from '../../lib/utils/fix-incomplete-html';
import { BlockHandler } from '../block-handler';
/**
 * Types
 */
import type { BlockEditorDispatch } from '../types';

export class JetpackFormHandler extends BlockHandler {
	currentListOfValidBlocks = [];

	constructor( clientId: string ) {
		super( clientId, [] );
		this.behavior = 'action';
		this.feature = 'jetpack-form-ai-extension';
		this.adjustPosition = false;
		this.startOpen = true;
		this.hideOnBlockFocus = false;
	}

	private setContent( newContent: string, isRequestDone = false ): void {
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' ) as BlockEditorDispatch;

		// Remove the Jetpack Form block from the content.
		const processedContent = newContent.replace(
			/<!-- (\/)*wp:jetpack\/(contact-)*form ({[^}]*} )*(\/)*-->/g,
			''
		);

		// Fix HTML tags that are not closed properly.
		const fixedContent = fixIncompleteHTML( processedContent );

		const newContentBlocks = parse( fixedContent );

		// Check if the generated blocks are valid.
		const validBlocks = newContentBlocks.filter( block => {
			return (
				block.isValid && ! [ 'core/freeform', 'core/missing', 'core/html' ].includes( block.name )
			);
		} );

		let lastBlockUpdated = false;

		// While streaming, the last block can go from valid to invalid and back as new children are added token by token.
		if ( validBlocks.length < this.currentListOfValidBlocks.length ) {
			// The last block is temporarily invalid, so we use the last valid state.
			validBlocks.push( this.currentListOfValidBlocks[ this.currentListOfValidBlocks.length - 1 ] );
		} else if (
			validBlocks.length === this.currentListOfValidBlocks.length &&
			validBlocks.length > 0
		) {
			// Update the last valid block with the new content if it is different.
			const lastBlock = validBlocks[ validBlocks.length - 1 ];
			const lastBlockFromCurrentList = this.currentListOfValidBlocks[ validBlocks.length - 1 ];
			lastBlockUpdated = ! compareBlocks( lastBlock, lastBlockFromCurrentList );
		}

		if (
			// Only update the blocks when there are valid blocks, to avoid having no children and triggering the empty state.
			validBlocks.length > 0 &&
			// Only update the blocks when the valid list changed, meaning a new block arrived or the last block was updated.
			( validBlocks.length !== this.currentListOfValidBlocks.length || lastBlockUpdated )
		) {
			// Only update the valid blocks
			replaceInnerBlocks( this.clientId, validBlocks );

			// Update the list of current valid blocks
			this.currentListOfValidBlocks = validBlocks;
		}

		// Final form adjustments (only when the request is done)
		if ( isRequestDone ) {
			/*
			 * Inspect generated blocks list,
			 * checking if the jetpack/button block:
			 * - if it exists twice or more, remove the first one.
			 * - if it does not exist, create one.
			 */
			const allButtonBlocks = validBlocks.filter( block => block.name === 'jetpack/button' );
			this.currentListOfValidBlocks = this.currentListOfValidBlocks || [];
			if ( allButtonBlocks.length > 1 ) {
				// Remove all button blocks, less the last one.
				let buttonCounter = 0;
				this.currentListOfValidBlocks = this.currentListOfValidBlocks.filter( block => {
					if ( block.name !== 'jetpack/button' ) {
						return true;
					}

					buttonCounter++;
					if ( buttonCounter === allButtonBlocks.length ) {
						return true;
					}
					return false;
				} );

				replaceInnerBlocks( this.clientId, this.currentListOfValidBlocks );
			} else if ( allButtonBlocks.length === 0 ) {
				// One button block is required.
				replaceInnerBlocks( this.clientId, [
					...this.currentListOfValidBlocks,
					createBlock( 'jetpack/button', {
						label: __( 'Submit', 'jetpack' ),
						element: 'button',
						text: __( 'Submit', 'jetpack' ),
						borderRadius: 8,
						lock: {
							remove: true,
						},
					} ),
				] );
			}

			// Reset the list of valid blocks after the request is done.
			this.currentListOfValidBlocks = [];
		}
	}

	public getContent() {
		const block = this.getBlock();
		if ( ! block ) {
			return '';
		}

		const { innerBlocks } = block;

		if ( ! innerBlocks?.length ) {
			return '';
		}

		return innerBlocks.reduce( ( acc, innerBlock ) => {
			return acc + serialize( innerBlock ) + '\n\n';
		}, '' );
	}

	public onSuggestion( suggestion: string ): void {
		this.setContent( suggestion );
	}

	public onDone( suggestion: string ): void {
		this.setContent( suggestion, true );
	}
}

export { JetpackChildrenFormHandler } from './children';
