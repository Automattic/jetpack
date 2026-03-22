/**
 * Tests for inserter-utils
 *
 * These tests verify the pure function that determines whether
 * the block inserter should be auto-opened in the form editor.
 */

import { shouldAutoOpenInserter } from '../../../../src/form-editor/utils/inserter-utils';

describe( 'inserter-utils', () => {
	describe( 'shouldAutoOpenInserter', () => {
		const defaultContext = {
			viewportWidth: 1024,
			showListViewByDefault: false,
			distractionFree: false,
		};

		test( 'returns true on desktop with no conflicting preferences', () => {
			expect( shouldAutoOpenInserter( defaultContext ) ).toBe( true );
		} );

		test( 'returns false when viewport is below 782px', () => {
			expect(
				shouldAutoOpenInserter( {
					...defaultContext,
					viewportWidth: 781,
				} )
			).toBe( false );
		} );

		test( 'returns true when viewport is exactly 782px', () => {
			expect(
				shouldAutoOpenInserter( {
					...defaultContext,
					viewportWidth: 782,
				} )
			).toBe( true );
		} );

		test( 'returns false when showListViewByDefault is true', () => {
			expect(
				shouldAutoOpenInserter( {
					...defaultContext,
					showListViewByDefault: true,
				} )
			).toBe( false );
		} );

		test( 'returns false when distractionFree is true', () => {
			expect(
				shouldAutoOpenInserter( {
					...defaultContext,
					distractionFree: true,
				} )
			).toBe( false );
		} );

		test( 'returns false when all conditions prevent opening', () => {
			expect(
				shouldAutoOpenInserter( {
					viewportWidth: 400,
					showListViewByDefault: true,
					distractionFree: true,
				} )
			).toBe( false );
		} );
	} );
} );
