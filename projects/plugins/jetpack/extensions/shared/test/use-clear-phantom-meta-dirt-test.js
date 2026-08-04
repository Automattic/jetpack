import { renderHook } from '@testing-library/react';
import * as wpData from '@wordpress/data';
import useClearPhantomMetaDirt from '../use-clear-phantom-meta-dirt';

const CRDT = '_crdt_document';

const editEntityRecord = jest.fn();
let staged;
let persisted;

// Renders the hook, then round-trips a save by handing it the record the server returned.
const runSave = savedMeta => {
	const { rerender } = renderHook( () => useClearPhantomMetaDirt( 'post', 1 ) );
	persisted = savedMeta;
	rerender();
};

describe( 'useClearPhantomMetaDirt', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		staged = { [ CRDT ]: 'blob-A', access: 'subscribers' };
		persisted = { [ CRDT ]: 'blob-A', access: 'everybody' };

		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( { editEntityRecord } );
		jest
			.spyOn( wpData, 'useSelect' )
			.mockImplementation( selector =>
				selector( () => ( { getRawEntityRecord: () => ( { meta: persisted } ) } ) )
			);
		jest.spyOn( wpData, 'useRegistry' ).mockReturnValue( {
			select: () => ( { getEntityRecordEdits: () => ( staged ? { meta: staged } : undefined ) } ),
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	test( 'adopts the saved CRDT snapshot, and nothing else', () => {
		runSave( { [ CRDT ]: 'blob-B', access: 'everybody' } );

		expect( editEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'post',
			1,
			{ meta: { [ CRDT ]: 'blob-B' } },
			{ undoIgnore: true }
		);
	} );

	// One assertion for every case that mints no snapshot: a failed save, an autosave, and
	// collaboration being off.
	test( 'no-op when the save left the snapshot alone', () => {
		runSave( { [ CRDT ]: 'blob-A', access: 'everybody' } );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'no-op when there are no staged meta edits', () => {
		staged = undefined;

		runSave( { [ CRDT ]: 'blob-B' } );

		expect( editEntityRecord ).not.toHaveBeenCalled();
	} );
} );
