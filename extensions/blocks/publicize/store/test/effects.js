/**
 * @jest-environment jsdom
 */

 /**
  * Internal dependencies
  */
import { computeTweetBlocks } from '../effects';

describe( 'computeTweetBlocks', () => {
	it( 'returns a supported block', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'uuid-1',
				innerBlocks: [],
			},
		];
		expect( computeTweetBlocks( blocks ) ).toEqual( blocks );
	} );

	it( 'returns a supported child block of an unsupported block', () => {
		const blocks = [
			{
				name: 'jetpack/fake-container-block',
				clientId: 'uuid-1',
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'uuid-2',
						innerBlocks: [],
					},
				],
			},
		];
		const expected = [
			{
				name: 'core/paragraph',
				clientId: 'uuid-2',
				innerBlocks: [],
			},
		];

		expect( computeTweetBlocks( blocks ) ).toEqual( expected );
	} );

	it( 'flattens the block tree', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				clientId: 'uuid-1',
				innerBlocks: [],
			},
			{
				name: 'jetpack/fake-container-block',
				clientId: 'uuid-2',
				innerBlocks: [
					{
						name: 'core/paragraph',
						clientId: 'uuid-3',
						innerBlocks: [],
					},
				],
			},
			{
				name: 'core/paragraph',
				clientId: 'uuid-4',
				innerBlocks: [],
			},
		];
		const expected = [
			{
				name: 'core/paragraph',
				clientId: 'uuid-1',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'uuid-3',
				innerBlocks: [],
			},
			{
				name: 'core/paragraph',
				clientId: 'uuid-4',
				innerBlocks: [],
			},
		];

		expect( computeTweetBlocks( blocks ) ).toEqual( expected );
	} );
} );

