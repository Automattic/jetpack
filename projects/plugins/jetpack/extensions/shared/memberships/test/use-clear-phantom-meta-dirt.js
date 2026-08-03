import { renderHook } from '@testing-library/react';
import { store as coreDataStore } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import useClearPhantomMetaDirt from '../use-clear-phantom-meta-dirt';

const CRDT = '_crdt_document';

const mockEditEntityRecord = jest.fn();

// Mutable state the mocked selectors read from, so a render can move the save along.
let state;

const reset = ( { stagedMeta, persistedMeta } ) => {
	state = {
		isSaving: false,
		isAutosaving: false,
		saveSucceeded: true,
		stagedMeta,
		persistedMeta,
	};
};

/**
 * Renders the hook, then drives it through save-start and save-finish. `duringSave` runs
 * while the request is in flight, so a test can simulate the writer editing meta mid-save.
 *
 * @param {Function} [duringSave] - Optional mutation applied while saving.
 */
const runSave = duringSave => {
	const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
	state.isSaving = true;
	rerender();
	if ( duringSave ) {
		duringSave();
	}
	state.isSaving = false;
	state.isAutosaving = false;
	rerender();
};

describe( 'useClearPhantomMetaDirt', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		reset( { stagedMeta: undefined, persistedMeta: {} } );

		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( {
			editEntityRecord: mockEditEntityRecord,
		} );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector =>
			selector( store =>
				store === editorStore
					? {
							isSavingPost: () => state.isSaving,
							isAutosavingPost: () => state.isAutosaving,
					  }
					: {}
			)
		);
		jest.spyOn( wpData, 'useRegistry' ).mockReturnValue( {
			select: store => {
				if ( store === coreDataStore ) {
					return {
						getEntityRecordEdits: () =>
							state.stagedMeta ? { meta: state.stagedMeta } : undefined,
						getRawEntityRecord: () => ( { meta: state.persistedMeta } ),
					};
				}
				if ( store === editorStore ) {
					return { didPostSaveRequestSucceed: () => state.saveSucceeded };
				}
				return {};
			},
		} );
	} );

	afterEach( () => {
		wpData.useSelect.mockRestore();
		wpData.useDispatch.mockRestore();
		wpData.useRegistry.mockRestore();
	} );

	test( 'realigns the stale CRDT snapshot the save left behind', () => {
		reset( { stagedMeta: { [ CRDT ]: 'blob-A' }, persistedMeta: { [ CRDT ]: 'blob-B' } } );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { [ CRDT ]: 'blob-B' } },
			{ undoIgnore: true }
		);
	} );

	test( 'realigns a value the server altered during the save', () => {
		reset( {
			stagedMeta: { [ CRDT ]: 'blob-A', paywalled: false },
			persistedMeta: { [ CRDT ]: 'blob-B', paywalled: true },
		} );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { [ CRDT ]: 'blob-B', paywalled: true } },
			{ undoIgnore: true }
		);
	} );

	test( 'restores a key the staged meta dropped, which alone keeps the post dirty', () => {
		reset( {
			stagedMeta: { [ CRDT ]: 'blob-B' },
			persistedMeta: { [ CRDT ]: 'blob-B', tier_id: 42 },
		} );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { tier_id: 42 } },
			{ undoIgnore: true }
		);
	} );

	test( 'leaves a key the writer changed while the save was in flight', () => {
		reset( {
			stagedMeta: { [ CRDT ]: 'blob-A', access: 'everybody' },
			persistedMeta: { [ CRDT ]: 'blob-B', access: 'everybody' },
		} );

		runSave( () => {
			state.stagedMeta = { [ CRDT ]: 'blob-A', access: 'subscribers' };
		} );

		// The CRDT residue is reconciled; the in-flight edit is not touched.
		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { [ CRDT ]: 'blob-B' } },
			{ undoIgnore: true }
		);
	} );

	test( 'no-op after an autosave, which never carries meta', () => {
		reset( { stagedMeta: { [ CRDT ]: 'blob-A' }, persistedMeta: { [ CRDT ]: 'blob-B' } } );

		const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
		state.isSaving = true;
		state.isAutosaving = true;
		rerender();
		state.isSaving = false;
		rerender();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when the save failed', () => {
		reset( { stagedMeta: { [ CRDT ]: 'blob-A' }, persistedMeta: { [ CRDT ]: 'blob-B' } } );
		state.saveSucceeded = false;

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when collaboration is off and nothing diverged', () => {
		reset( { stagedMeta: { access: 'subscribers' }, persistedMeta: { access: 'subscribers' } } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when there are no staged meta edits', () => {
		reset( { stagedMeta: undefined, persistedMeta: { [ CRDT ]: 'blob-B' } } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );
} );
