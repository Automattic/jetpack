/**
 * Tests for selection-utils
 *
 * These tests verify the pure function that decides whether the form editor
 * should run a selection-enforcement pass on the current subscribe tick.
 */

import {
	shouldRunSelectionEnforcement,
	shouldSelectFormBlock,
} from '../../../../src/form-editor/utils/selection-utils';

describe( 'selection-utils', () => {
	describe( 'shouldRunSelectionEnforcement', () => {
		test( 'returns true when a different block became selected', () => {
			expect(
				shouldRunSelectionEnforcement( {
					selectedBlockId: 'block-2',
					lastSelectedBlockId: 'block-1',
				} )
			).toBe( true );
		} );

		test( 'returns false when the same block is still selected', () => {
			expect(
				shouldRunSelectionEnforcement( {
					selectedBlockId: 'block-1',
					lastSelectedBlockId: 'block-1',
				} )
			).toBe( false );
		} );

		test( 'returns true when the selection was just cleared', () => {
			expect(
				shouldRunSelectionEnforcement( {
					selectedBlockId: null,
					lastSelectedBlockId: 'block-1',
				} )
			).toBe( true );
		} );

		// Regression: enforcement can bail out (inserter open, multi-selection) on the
		// tick that first observes the empty selection. If an already-empty selection
		// were treated as "no change", the form block would never be re-selected once
		// the blocking condition cleared, leaving the form settings unreachable.
		test( 'returns true when the selection is still empty from a previous tick', () => {
			expect(
				shouldRunSelectionEnforcement( {
					selectedBlockId: null,
					lastSelectedBlockId: null,
				} )
			).toBe( true );
		} );

		test( 'returns true on the first tick, when nothing has been observed yet', () => {
			expect(
				shouldRunSelectionEnforcement( {
					selectedBlockId: undefined,
					lastSelectedBlockId: null,
				} )
			).toBe( true );
		} );
	} );

	describe( 'shouldSelectFormBlock', () => {
		test( 'returns true when no block is selected', () => {
			expect(
				shouldSelectFormBlock( {
					selectedBlockId: null,
					hasMultiSelection: false,
				} )
			).toBe( true );
		} );

		test( 'returns false when a block is already selected', () => {
			expect(
				shouldSelectFormBlock( {
					selectedBlockId: 'block-1',
					hasMultiSelection: false,
				} )
			).toBe( false );
		} );

		// getSelectedBlockClientId() is null during a multi-selection, so without this
		// guard the form block would be force-selected and the user's range destroyed.
		test( 'returns false during a multi-selection', () => {
			expect(
				shouldSelectFormBlock( {
					selectedBlockId: null,
					hasMultiSelection: true,
				} )
			).toBe( false );
		} );

		test( 'returns true when the selection is undefined', () => {
			expect(
				shouldSelectFormBlock( {
					selectedBlockId: undefined,
					hasMultiSelection: false,
				} )
			).toBe( true );
		} );
	} );
} );
