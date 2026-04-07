/**
 * Tests for block-nesting-logic
 *
 * These tests verify the pure function that determines what action to take
 * when moving blocks into the form. Covers:
 * - Empty form (placeholder state) -> add submit button
 * - Dedupe empty paragraph logic
 * - Correct insertion index calculation when submit button exists
 */

import { determineBlockNestingAction } from '../../../../src/form-editor/utils/block-nesting-logic';

describe( 'block-nesting-logic', () => {
	describe( 'determineBlockNestingAction', () => {
		describe( 'empty form (placeholder state)', () => {
			test( 'should add submit button when form is empty', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 0,
					targetWasEmpty: true,
				} );
			} );

			test( 'should add submit button when moving multiple blocks into empty form', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
					{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
					{ name: 'core/paragraph', clientId: 'para-1', innerBlocks: [], attributes: {} },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 0,
					targetWasEmpty: true,
				} );
			} );

			test( 'should add submit button when moving empty paragraph into empty form', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'para-1',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 0,
					targetWasEmpty: true,
				} );
			} );
		} );

		describe( 'dedupe empty paragraph', () => {
			test( 'should dedupe when moving single empty paragraph and form has one at end', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'dedupe-empty-paragraph',
					existingEmptyParagraphId: 'existing-para',
				} );
			} );

			test( 'should dedupe when form has empty paragraph with no button', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'dedupe-empty-paragraph',
					existingEmptyParagraphId: 'existing-para',
				} );
			} );

			test( 'should dedupe with empty paragraph object content', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: {} },
						},
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: {} },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'dedupe-empty-paragraph',
					existingEmptyParagraphId: 'existing-para',
				} );
			} );

			test( 'should not dedupe when moving multiple blocks including empty paragraph', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result.type ).toBe( 'move-blocks' );
			} );

			test( 'should not dedupe when moving non-empty paragraph', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: 'Some text' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result.type ).toBe( 'move-blocks' );
			} );

			test( 'should not dedupe when form has no empty paragraph at end', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'para-with-text',
							innerBlocks: [],
							attributes: { content: 'Not empty' },
						},
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result.type ).toBe( 'move-blocks' );
			} );

			test( 'should find empty paragraph before button, not button itself', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: {},
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'dedupe-empty-paragraph',
					existingEmptyParagraphId: 'existing-para',
				} );
			} );

			test( 'should handle core/button instead of jetpack/button', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{
							name: 'core/paragraph',
							clientId: 'existing-para',
							innerBlocks: [],
							attributes: { content: '' },
						},
						{ name: 'core/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{
						name: 'core/paragraph',
						clientId: 'new-para',
						innerBlocks: [],
						attributes: { content: '' },
					},
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'dedupe-empty-paragraph',
					existingEmptyParagraphId: 'existing-para',
				} );
			} );
		} );

		describe( 'insertion index with submit button', () => {
			test( 'should insert before jetpack/button when it exists', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-name', clientId: 'name-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 2, // Before button at index 2
					targetWasEmpty: false,
				} );
			} );

			test( 'should insert before core/button when it exists', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{ name: 'core/button', clientId: 'button-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 1, // Before button at index 1
					targetWasEmpty: false,
				} );
			} );

			test( 'should insert at end when no button exists', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-name', clientId: 'name-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 2, // At the end
					targetWasEmpty: false,
				} );
			} );

			test( 'should insert before first button when multiple buttons exist', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
						{ name: 'core/button', clientId: 'button-2', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 1, // Before first button
					targetWasEmpty: false,
				} );
			} );

			test( 'should handle button at the beginning', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [
						{ name: 'jetpack/button', clientId: 'button-1', innerBlocks: [] },
						{ name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] },
					],
				};

				const blocksToMove = [
					{ name: 'jetpack/field-text', clientId: 'text-1', innerBlocks: [] },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result ).toEqual( {
					type: 'move-blocks',
					insertionIndex: 0, // Before button at beginning
					targetWasEmpty: false,
				} );
			} );
		} );

		describe( 'edge cases', () => {
			test( 'should not crash with malformed blocks', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [ { name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] } ],
				};

				const blocksToMove = [
					// Testing malformed block
					{ clientId: 'malformed-1' },
				];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result.type ).toBe( 'move-blocks' );
			} );

			test( 'should handle empty blocksToMove array', () => {
				const formBlock = {
					name: 'jetpack/contact-form',
					clientId: 'form-1',
					innerBlocks: [ { name: 'jetpack/field-email', clientId: 'email-1', innerBlocks: [] } ],
				};

				const blocksToMove = [];

				const result = determineBlockNestingAction( formBlock, blocksToMove );

				expect( result.type ).toBe( 'move-blocks' );
			} );
		} );
	} );
} );
