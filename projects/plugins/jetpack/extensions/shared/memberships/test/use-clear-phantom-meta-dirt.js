import { renderHook } from '@testing-library/react';
import { store as coreDataStore } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import useClearPhantomMetaDirt from '../use-clear-phantom-meta-dirt';

const CRDT = '_crdt_document';

const mockEditEntityRecord = jest.fn();
let state;

const setup = ( stagedMeta, persistedMeta ) => {
	state = { isSaving: false, isAutosaving: false, saveSucceeded: true, stagedMeta, persistedMeta };
};

// Renders the hook and drives it through save-start and save-finish. `duringSave` lets a test
// simulate the writer editing meta while the request is in flight.
const runSave = duringSave => {
	const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
	state.isSaving = true;
	rerender();
	duringSave?.();
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
		jest
			.spyOn( wpData, 'useSelect' )
			.mockImplementation( selector =>
				selector( store =>
					store === editorStore
						? { isSavingPost: () => state.isSaving, isAutosavingPost: () => state.isAutosaving }
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
				return store === editorStore
					? { didPostSaveRequestSucceed: () => state.saveSucceeded }
					: {};
			},
		} );
	} );

	afterEach( () => {
		wpData.useSelect.mockRestore();
		wpData.useDispatch.mockRestore();
		wpData.useRegistry.mockRestore();
	} );

	test( 'realigns the stale CRDT snapshot and any value the server altered', () => {
		setup( { [ CRDT ]: 'blob-A', paywalled: false }, { [ CRDT ]: 'blob-B', paywalled: true } );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			...realignCall( { [ CRDT ]: 'blob-B', paywalled: true } )
		);
	} );

	test( 'restores a key the staged meta dropped, which alone keeps the post dirty', () => {
		setup( { [ CRDT ]: 'blob-B' }, { [ CRDT ]: 'blob-B', tier_id: 42 } );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith( ...realignCall( { tier_id: 42 } ) );
	} );

	test( 'leaves a key the writer changed while the save was in flight', () => {
		setup(
			{ [ CRDT ]: 'blob-A', access: 'everybody' },
			{ [ CRDT ]: 'blob-B', access: 'everybody' }
		);

		runSave( () => {
			state.stagedMeta = { [ CRDT ]: 'blob-A', access: 'subscribers' };
		} );

		expect( mockEditEntityRecord ).toHaveBeenCalledWith( ...realignCall( { [ CRDT ]: 'blob-B' } ) );
	} );

	test( 'no-op after an autosave, which never carries meta', () => {
		setup( { [ CRDT ]: 'blob-A' }, { [ CRDT ]: 'blob-B' } );

		const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
		state.isSaving = true;
		state.isAutosaving = true;
		rerender();
		state.isSaving = false;
		rerender();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when the save failed', () => {
		setup( { [ CRDT ]: 'blob-A' }, { [ CRDT ]: 'blob-B' } );
		state.saveSucceeded = false;

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
