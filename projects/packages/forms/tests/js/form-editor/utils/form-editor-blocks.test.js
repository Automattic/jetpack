/**
 * Tests for block-filter-utils
 */

import {
	getValidFormFieldBlocks,
	getBlocksToHide,
} from '../../../../src/form-editor/utils/block-filter-utils';

describe( 'getValidFormFieldBlocks', () => {
	const PARENT = 'jetpack/contact-form';

	test( 'filters blocks based on parent restriction', () => {
		const blocks = [
			{ name: 'field-a', settings: { parent: PARENT } },
			{ name: 'field-b', settings: { parent: [ PARENT, 'other/block' ] } },
			{ name: 'field-c', settings: {} },
			{ name: 'excluded', settings: { parent: 'other/block' } },
		];

		expect( getValidFormFieldBlocks( blocks, PARENT ) ).toEqual( [
			'jetpack/field-a',
			'jetpack/field-b',
			'jetpack/field-c',
		] );
	} );

	test( 'returns empty array for empty input', () => {
		expect( getValidFormFieldBlocks( [], PARENT ) ).toEqual( [] );
	} );
} );

describe( 'getBlocksToHide', () => {
	test( 'returns blocks not in allowed set', () => {
		const all = [ 'a', 'b', 'c' ];
		const allowed = new Set( [ 'a' ] );

		expect( getBlocksToHide( all, allowed ) ).toEqual( [ 'b', 'c' ] );
	} );

	test( 'returns empty array when all allowed', () => {
		const all = [ 'a', 'b' ];
		const allowed = new Set( [ 'a', 'b' ] );

		expect( getBlocksToHide( all, allowed ) ).toEqual( [] );
	} );
} );
