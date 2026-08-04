import { renderHook } from '@testing-library/react';
import { store as coreDataStore } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import useClearPhantomMetaDirt from '../use-clear-phantom-meta-dirt';

const CRDT = '_crdt_document';

const mockEditEntityRecord = jest.fn();
let state;

const setup = ( stagedMeta, persistedMeta ) => {
	state = { isSaving: false, isAutosaving: false, saveError: undefined, stagedMeta, persistedMeta };
};

// Renders the hook and drives it through the start and end of an entity save request.
const runSave = () => {
	const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
	state.isSaving = true;
	rerender();
	state.isSaving = false;
	state.isAutosaving = false;
	rerender();
};

const realignCall = meta => [ 'postType', 'post', 1, { meta }, { undoIgnore: true } ];

describe( 'useClearPhantomMetaDirt', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setup( undefined, {} );

		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( {
			editEntityRecord: mockEditEntityRecord,
		} );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector =>
			selector( store =>
				store === coreDataStore
					? {
							isSavingEntityRecord: () => state.isSaving,
							isAutosavingEntityRecord: () => state.isAutosaving,
					  }
					: {}
			)
		);
		jest.spyOn( wpData, 'useRegistry' ).mockReturnValue( {
			select: store =>
				store === coreDataStore
					? {
							getEntityRecordEdits: () =>
								state.stagedMeta ? { meta: state.stagedMeta } : undefined,
							getLastEntitySaveError: () => state.saveError,
							getRawEntityRecord: () => ( { meta: state.persistedMeta } ),
					  }
					: {},
		} );
	} );

	afterEach( () => {
		wpData.useSelect.mockRestore();
		wpData.useDispatch.mockRestore();
		wpData.useRegistry.mockRestore();
	} );

	test( 'realigns the stale CRDT snapshot', () => {
		setup( { [ CRDT ]: 'blob-A', paywalled: false }, { [ CRDT ]: 'blob-B', paywalled: false } );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith( ...realignCall( { [ CRDT ]: 'blob-B' } ) );
	} );

	test( 'leaves a key the staged meta dropped, which may be a pending deletion', () => {
		setup( { [ CRDT ]: 'blob-B' }, { [ CRDT ]: 'blob-B', tier_id: 42 } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'leaves a diverged value alone, since it may be an edit that was never sent', () => {
		setup(
			{ [ CRDT ]: 'blob-A', access: 'subscribers' },
			{ [ CRDT ]: 'blob-B', access: 'everybody' }
		);

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith( ...realignCall( { [ CRDT ]: 'blob-B' } ) );
	} );

	test( 'no-op when the editor saves but no entity request runs, as when preSavePost rejects', () => {
		setup( { [ CRDT ]: 'blob-A' }, { [ CRDT ]: 'blob-B' } );

		const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
		rerender();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op after an autosave, which mints no CRDT snapshot', () => {
		setup( { [ CRDT ]: 'blob-A' }, { [ CRDT ]: 'blob-B' } );
		state.isAutosaving = true;

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when the save failed', () => {
		setup( { [ CRDT ]: 'blob-A' }, { [ CRDT ]: 'blob-B' } );
		state.saveError = { message: 'nope' };

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when nothing diverged, the usual case off collaboration', () => {
		setup( { access: 'subscribers' }, { access: 'subscribers' } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when there are no staged meta edits', () => {
		setup( undefined, { [ CRDT ]: 'blob-B' } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );
} );
