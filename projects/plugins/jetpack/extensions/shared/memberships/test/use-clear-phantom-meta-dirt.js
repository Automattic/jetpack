import { renderHook } from '@testing-library/react';
import { store as coreDataStore } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import useClearPhantomMetaDirt from '../use-clear-phantom-meta-dirt';

const CRDT = '_crdt_document';

const mockEditEntityRecord = jest.fn();
const mockGetEntityRecordEdits = jest.fn();
const mockGetRawEntityRecord = jest.fn();

const setup = ( { stagedMeta, persistedDoc } ) => {
	mockGetEntityRecordEdits.mockReturnValue( stagedMeta ? { meta: stagedMeta } : undefined );
	mockGetRawEntityRecord.mockReturnValue( {
		meta: persistedDoc ? { [ CRDT ]: persistedDoc } : {},
	} );
};

// Drives the hook through a full save: saving → saved.
const runSave = () => {
	let isSaving = true;
	jest
		.spyOn( wpData, 'useSelect' )
		.mockImplementation( selector =>
			selector( store => ( store === editorStore ? { isSavingPost: () => isSaving } : {} ) )
		);

	const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
	isSaving = false;
	rerender();
};

describe( 'useClearPhantomMetaDirt', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( {
			editEntityRecord: mockEditEntityRecord,
		} );
		jest.spyOn( wpData, 'useRegistry' ).mockReturnValue( {
			select: store =>
				store === coreDataStore
					? {
							getEntityRecordEdits: mockGetEntityRecordEdits,
							getRawEntityRecord: mockGetRawEntityRecord,
					  }
					: {},
		} );
	} );

	afterEach( () => {
		wpData.useSelect.mockRestore();
		wpData.useDispatch.mockRestore();
		wpData.useRegistry.mockRestore();
	} );

	test( 'realigns the stale CRDT key once a save finishes', () => {
		setup( { stagedMeta: { [ CRDT ]: 'blob-A' }, persistedDoc: 'blob-B' } );

		runSave();

		expect( mockEditEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { [ CRDT ]: 'blob-B' } },
			{ undoIgnore: true }
		);
	} );

	test( 'does nothing while no save has completed', () => {
		setup( { stagedMeta: { [ CRDT ]: 'blob-A' }, persistedDoc: 'blob-B' } );

		jest
			.spyOn( wpData, 'useSelect' )
			.mockImplementation( selector =>
				selector( store => ( store === editorStore ? { isSavingPost: () => false } : {} ) )
			);
		renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when collaboration is off (no persisted CRDT doc)', () => {
		setup( { stagedMeta: { _jetpack_newsletter_access: 'subscribers' }, persistedDoc: null } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when there are no staged meta edits at all', () => {
		setup( { stagedMeta: null, persistedDoc: 'blob-B' } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when the staged CRDT value already matches the persisted one', () => {
		setup( { stagedMeta: { [ CRDT ]: 'blob-B' }, persistedDoc: 'blob-B' } );

		runSave();

		expect( mockEditEntityRecord ).not.toHaveBeenCalled();
	} );
} );
