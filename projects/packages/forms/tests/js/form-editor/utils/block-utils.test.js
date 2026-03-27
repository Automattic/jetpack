/**
 * Tests for block-utils
 *
 * These tests verify the pure functions that manipulate blocks.
 */

import {
	findFormBlock,
	findStepContainer,
	findActiveStepInContainer,
	getInsertionIndex,
	shouldLockBlock,
	getBlocksToMove,
	isEmptyParagraph,
} from '../../../../src/form-editor/utils/block-utils';

describe( 'block-utils', () => {
	describe( 'findFormBlock', () => {
		test( 'finds contact-form block', () => {
			const blocks = [
				{ name: 'core/paragraph', clientId: '123', innerBlocks: [] },
				{ name: 'jetpack/contact-form', clientId: '456', innerBlocks: [] },
				{ name: 'core/heading', clientId: '789', innerBlocks: [] },
			];

			const result = findFormBlock( blocks );

			expect( result ).toEqual( {
				name: 'jetpack/contact-form',
				clientId: '456',
				innerBlocks: [],
			} );
		} );

		test( 'returns null when form block not found', () => {
			const blocks = [
				{ name: 'core/paragraph', clientId: '123', innerBlocks: [] },
				{ name: 'core/heading', clientId: '789', innerBlocks: [] },
			];

			const result = findFormBlock( blocks );

			expect( result ).toBeNull();
		} );

		test( 'returns null for empty array', () => {
			const result = findFormBlock( [] );
			expect( result ).toBeNull();
		} );

		test( 'returns first form block when multiple exist', () => {
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: '111', innerBlocks: [] },
				{ name: 'core/paragraph', clientId: '222', innerBlocks: [] },
				{ name: 'jetpack/contact-form', clientId: '333', innerBlocks: [] },
			];

			const result = findFormBlock( blocks );

			expect( result?.clientId ).toBe( '111' );
		} );

		test( 'finds form block at beginning of array', () => {
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: 'first', innerBlocks: [] },
				{ name: 'core/paragraph', clientId: 'second', innerBlocks: [] },
			];

			const result = findFormBlock( blocks );

			expect( result?.clientId ).toBe( 'first' );
		} );

		test( 'finds form block at end of array', () => {
			const blocks = [
				{ name: 'core/paragraph', clientId: 'first', innerBlocks: [] },
				{ name: 'core/heading', clientId: 'second', innerBlocks: [] },
				{ name: 'jetpack/contact-form', clientId: 'last', innerBlocks: [] },
			];

			const result = findFormBlock( blocks );

			expect( result?.clientId ).toBe( 'last' );
		} );

		test( 'preserves block properties', () => {
			const blocks = [
				{
					name: 'jetpack/contact-form',
					clientId: '456',
					innerBlocks: [],
					attributes: { formId: 123 },
					customProp: 'value',
				},
			];

			const result = findFormBlock( blocks );

			expect( result ).toEqual( {
				name: 'jetpack/contact-form',
				clientId: '456',
				innerBlocks: [],
				attributes: { formId: 123 },
				customProp: 'value',
			} );
		} );
	} );

	describe( 'findStepContainer', () => {
		test( 'finds step container in form block', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: 'form-1',
				innerBlocks: [
					{ name: 'jetpack/form-progress-indicator', clientId: 'prog-1', innerBlocks: [] },
					{
						name: 'jetpack/form-step-container',
						clientId: 'container-1',
						innerBlocks: [ { name: 'jetpack/form-step', clientId: 'step-1', innerBlocks: [] } ],
					},
					{ name: 'jetpack/form-step-navigation', clientId: 'nav-1', innerBlocks: [] },
				],
			};

			const result = findStepContainer( formBlock );
			expect( result?.clientId ).toBe( 'container-1' );
		} );

		test( 'returns null when no step container exists', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: 'form-1',
				innerBlocks: [
					{ name: 'jetpack/field-text', clientId: 'field-1', innerBlocks: [] },
					{ name: 'core/button', clientId: 'btn-1', innerBlocks: [] },
				],
			};

			expect( findStepContainer( formBlock ) ).toBeNull();
		} );

		test( 'returns null for empty form', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: 'form-1',
				innerBlocks: [],
			};

			expect( findStepContainer( formBlock ) ).toBeNull();
		} );

		test( 'finds step container nested inside a child block', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: 'form-1',
				innerBlocks: [
					{
						name: 'core/group',
						clientId: 'group-1',
						innerBlocks: [
							{
								name: 'jetpack/form-step-container',
								clientId: 'container-1',
								innerBlocks: [ { name: 'jetpack/form-step', clientId: 'step-1', innerBlocks: [] } ],
							},
						],
					},
				],
			};

			const result = findStepContainer( formBlock );
			expect( result?.clientId ).toBe( 'container-1' );
		} );
	} );

	describe( 'findActiveStepInContainer', () => {
		const stepContainer = {
			name: 'jetpack/form-step-container',
			clientId: 'container-1',
			innerBlocks: [
				{ name: 'jetpack/form-step', clientId: 'step-1', innerBlocks: [] },
				{ name: 'jetpack/form-step', clientId: 'step-2', innerBlocks: [] },
				{ name: 'jetpack/form-step', clientId: 'step-3', innerBlocks: [] },
			],
		};

		test( 'finds the active step by ID', () => {
			const result = findActiveStepInContainer( stepContainer, 'step-2' );
			expect( result?.clientId ).toBe( 'step-2' );
		} );

		test( 'falls back to first step when activeStepId is null', () => {
			const result = findActiveStepInContainer( stepContainer, null );
			expect( result?.clientId ).toBe( 'step-1' );
		} );

		test( 'falls back to first step when activeStepId not found', () => {
			const result = findActiveStepInContainer( stepContainer, 'nonexistent' );
			expect( result?.clientId ).toBe( 'step-1' );
		} );

		test( 'returns null when step container has no steps', () => {
			const emptyContainer = {
				name: 'jetpack/form-step-container',
				clientId: 'container-1',
				innerBlocks: [],
			};

			expect( findActiveStepInContainer( emptyContainer, null ) ).toBeNull();
		} );
	} );

	describe( 'getInsertionIndex', () => {
		test( 'returns index before jetpack/button', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [
					{ name: 'jetpack/field-email', clientId: '1', innerBlocks: [] },
					{ name: 'jetpack/field-text', clientId: '2', innerBlocks: [] },
					{ name: 'jetpack/button', clientId: '3', innerBlocks: [] },
				],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 2 ); // Before button at index 2
		} );

		test( 'returns index before core/button', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [
					{ name: 'jetpack/field-email', clientId: '1', innerBlocks: [] },
					{ name: 'core/button', clientId: '2', innerBlocks: [] },
				],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 1 ); // Before button at index 1
		} );

		test( 'returns length when no button exists', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [
					{ name: 'jetpack/field-email', clientId: '1', innerBlocks: [] },
					{ name: 'jetpack/field-text', clientId: '2', innerBlocks: [] },
				],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 2 ); // End of array
		} );

		test( 'returns 0 for empty innerBlocks', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 0 );
		} );

		test( 'returns index before first button when multiple buttons exist', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [
					{ name: 'jetpack/field-email', clientId: '1', innerBlocks: [] },
					{ name: 'jetpack/button', clientId: '2', innerBlocks: [] },
					{ name: 'core/button', clientId: '3', innerBlocks: [] },
				],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 1 ); // Before first button
		} );

		test( 'handles button at the beginning', () => {
			const formBlock = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [
					{ name: 'jetpack/button', clientId: '1', innerBlocks: [] },
					{ name: 'jetpack/field-email', clientId: '2', innerBlocks: [] },
				],
			};

			const index = getInsertionIndex( formBlock );

			expect( index ).toBe( 0 ); // Before button at beginning
		} );
	} );

	describe( 'shouldLockBlock', () => {
		test( 'returns true when block has no attributes', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when block has no lock attribute', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					formId: 123,
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when block has lock but no remove property', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						move: true,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when block has lock but no move property', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: true,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns false when block has both remove and move locks set to true', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: true,
						move: true,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( false );
		} );

		test( 'returns true when block has remove lock but move is false', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: true,
						move: false,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when block has move lock but remove is false', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: false,
						move: true,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when both locks are set to false', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: false,
						move: false,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when only remove is set to false', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: false,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when only move is set to false', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						move: false,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns false when both locks are set to truthy values', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: 1,
						move: 'yes',
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( false );
		} );

		test( 'returns true when remove is truthy but move is falsy', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: 1,
						move: 0,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );

		test( 'returns true when move is truthy but remove is falsy', () => {
			const block = {
				name: 'jetpack/contact-form',
				clientId: '123',
				innerBlocks: [],
				attributes: {
					lock: {
						remove: 0,
						move: 1,
					},
				},
			};

			expect( shouldLockBlock( block ) ).toBe( true );
		} );
	} );

	describe( 'getBlocksToMove', () => {
		test( 'filters out form block by clientId', () => {
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] },
				{ name: 'core/paragraph', clientId: 'para-1', innerBlocks: [] },
				{ name: 'core/heading', clientId: 'head-1', innerBlocks: [] },
			];

			const result = getBlocksToMove( blocks, 'form-1' );

			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ].clientId ).toBe( 'para-1' );
			expect( result[ 1 ].clientId ).toBe( 'head-1' );
		} );

		test( 'returns empty array when only form block exists', () => {
			const blocks = [ { name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] } ];

			const result = getBlocksToMove( blocks, 'form-1' );

			expect( result ).toEqual( [] );
		} );

		test( 'returns all blocks when form block clientId not found', () => {
			const blocks = [
				{ name: 'core/paragraph', clientId: 'para-1', innerBlocks: [] },
				{ name: 'core/heading', clientId: 'head-1', innerBlocks: [] },
			];

			const result = getBlocksToMove( blocks, 'nonexistent' );

			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ].clientId ).toBe( 'para-1' );
			expect( result[ 1 ].clientId ).toBe( 'head-1' );
		} );

		test( 'handles empty array', () => {
			const result = getBlocksToMove( [], 'form-1' );
			expect( result ).toEqual( [] );
		} );

		test( 'preserves block order', () => {
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] },
				{ name: 'core/paragraph', clientId: 'para-1', innerBlocks: [] },
				{ name: 'core/heading', clientId: 'head-1', innerBlocks: [] },
				{ name: 'core/image', clientId: 'img-1', innerBlocks: [] },
			];

			const result = getBlocksToMove( blocks, 'form-1' );

			expect( result ).toHaveLength( 3 );
			expect( result[ 0 ].clientId ).toBe( 'para-1' );
			expect( result[ 1 ].clientId ).toBe( 'head-1' );
			expect( result[ 2 ].clientId ).toBe( 'img-1' );
		} );

		test( 'preserves block properties', () => {
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] },
				{
					name: 'core/paragraph',
					clientId: 'para-1',
					innerBlocks: [],
					attributes: { content: 'Hello' },
				},
			];

			const result = getBlocksToMove( blocks, 'form-1' );

			expect( result[ 0 ] ).toEqual( {
				name: 'core/paragraph',
				clientId: 'para-1',
				innerBlocks: [],
				attributes: { content: 'Hello' },
			} );
		} );

		test( 'filters multiple form blocks if same clientId', () => {
			// This shouldn't happen in practice, but test the behavior
			const blocks = [
				{ name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] },
				{ name: 'core/paragraph', clientId: 'para-1', innerBlocks: [] },
				{ name: 'jetpack/contact-form', clientId: 'form-1', innerBlocks: [] },
			];

			const result = getBlocksToMove( blocks, 'form-1' );

			expect( result ).toHaveLength( 1 );
			expect( result[ 0 ].clientId ).toBe( 'para-1' );
		} );
	} );

	describe( 'isEmptyParagraph', () => {
		test( 'returns false for non-paragraph blocks', () => {
			const block = { name: 'core/heading', attributes: { content: '' } };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );

		test( 'returns false for jetpack blocks', () => {
			const block = { name: 'jetpack/field-text', attributes: {} };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );

		test( 'returns true when content is undefined', () => {
			const block = { name: 'core/paragraph', attributes: {} };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns true when attributes is undefined', () => {
			const block = { name: 'core/paragraph' };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns true when content is null', () => {
			const block = { name: 'core/paragraph', attributes: { content: null } };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns true when content is empty string', () => {
			const block = { name: 'core/paragraph', attributes: { content: '' } };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns false when content is non-empty string', () => {
			const block = { name: 'core/paragraph', attributes: { content: 'Hello world' } };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );

		test( 'returns false when content is whitespace-only string', () => {
			const block = { name: 'core/paragraph', attributes: { content: '   ' } };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );

		test( 'returns true when content is empty object {}', () => {
			const block = { name: 'core/paragraph', attributes: { content: {} } };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns false when content is object with toString returning non-empty', () => {
			const richTextValue = {
				toString() {
					return 'Some content';
				},
			};
			const block = { name: 'core/paragraph', attributes: { content: richTextValue } };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );

		test( 'returns true when content is object with toString returning empty', () => {
			const emptyRichTextValue = {
				toString() {
					return '';
				},
			};
			const block = { name: 'core/paragraph', attributes: { content: emptyRichTextValue } };
			expect( isEmptyParagraph( block ) ).toBe( true );
		} );

		test( 'returns false for paragraph with HTML content', () => {
			const block = { name: 'core/paragraph', attributes: { content: '<strong>Bold</strong>' } };
			expect( isEmptyParagraph( block ) ).toBe( false );
		} );
	} );
} );
