/**
 * External
 */
import { parse, serialize, createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal
 */
import { compareBlocks } from '../../../lib/utils/compare-blocks';
import { fixIncompleteHTML } from '../../../lib/utils/fix-incomplete-html';
import { BlockHandler } from '../block-handler';
/**
 * Types
 */
import type { BlockEditorDispatch } from '../types';
import type { Block as WPBlock } from '@wordpress/blocks';

export class JetpackFormHandler extends BlockHandler {
	currentListOfValidBlocks = [];
	originalVariationName: string | null = null;

	constructor( clientId: string ) {
		super( clientId, [] );
		this.behavior = 'action';
		this.feature = 'jetpack-form-ai-extension';
		this.startOpen = true;
		this.hideOnBlockFocus = false;
		this.adjustPosition = false;
		this.supports = {
			file_upload_field: 1,
		};
	}

	private setContent( newContent: string, isRequestDone = false ): void {
		const { replaceInnerBlocks, updateBlockAttributes } = dispatch(
			'core/block-editor'
		) as BlockEditorDispatch;

		// Parse the content first to extract variation name properly
		const parsedBlocks = parse( newContent );

		// Extract variation name from the parsed contact-form block if present
		const contactFormBlock = parsedBlocks.find( block => block.name === 'jetpack/contact-form' );
		if ( contactFormBlock && contactFormBlock.attributes?.variationName ) {
			this.originalVariationName = contactFormBlock.attributes.variationName as string;
		}

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
			// Restore the variation name if it was present in the original content
			if ( this.originalVariationName ) {
				const currentBlock = this.getBlock();
				if (
					currentBlock &&
					currentBlock.attributes.variationName !== this.originalVariationName
				) {
					updateBlockAttributes( this.clientId, { variationName: this.originalVariationName } );
				}
			}

			/*
			 * Inspect generated blocks list,
			 * checking the submit button block (core/button or jetpack/button):
			 * - if it exists twice or more, remove the first one.
			 * - if it does not exist, create one (unless there's a navigation block).
			 */
			const isButtonBlock = ( block: ( typeof validBlocks )[ number ] ) =>
				block.name === 'jetpack/button' ||
				( block.name === 'core/button' && block.attributes?.tagName === 'button' );

			const allButtonBlocks = validBlocks.filter( isButtonBlock );
			const hasNavigationBlock = validBlocks.some(
				block => block.name === 'jetpack/form-step-navigation'
			);

			this.currentListOfValidBlocks = this.currentListOfValidBlocks || [];
			if ( allButtonBlocks.length > 1 ) {
				// Remove all button blocks, less the last one.
				let buttonCounter = 0;
				this.currentListOfValidBlocks = this.currentListOfValidBlocks.filter( block => {
					if ( ! isButtonBlock( block ) ) {
						return true;
					}

					buttonCounter++;
					if ( buttonCounter === allButtonBlocks.length ) {
						return true;
					}
					return false;
				} );

				replaceInnerBlocks( this.clientId, this.currentListOfValidBlocks );
			} else if ( allButtonBlocks.length === 0 && ! hasNavigationBlock ) {
				// One button block is required for non-multistep forms.
				replaceInnerBlocks( this.clientId, [
					...this.currentListOfValidBlocks,
					createBlock( 'core/button', {
						tagName: 'button',
						type: 'submit',
						text: __( 'Submit', 'jetpack' ),
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

	public getExtensionInputPlaceholder(): string {
		const content = this.getContent();

		if ( ! content ) {
			// If the block is empty, return a random example for creating a form.
			const createExamples = [
				__( 'Example: a contact form with name, email, and message fields', 'jetpack' ),
				__(
					'Example: a pizza ordering form with name, address, phone number and toppings',
					'jetpack'
				),
				__( 'Example: a survey form with multiple choice questions', 'jetpack' ),
			];

			return createExamples[ Math.floor( Math.random() * createExamples.length ) ];
		}
		// If the block has content, return a random example for editing a form.
		const editExamples = [
			__( 'Example: remove email field', 'jetpack' ),
			__( 'Example: make email optional', 'jetpack' ),
			__( 'Example: add message field and make it required', 'jetpack' ),
		];

		return editExamples[ Math.floor( Math.random() * editExamples.length ) ];
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
			return acc + serialize( innerBlock as WPBlock ) + '\n\n';
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
