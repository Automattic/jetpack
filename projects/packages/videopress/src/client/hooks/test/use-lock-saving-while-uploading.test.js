import { renderHook } from '@testing-library/react';
import useLockSavingWhileUploading, {
	UPLOAD_IN_PROGRESS_NOTICE_ID,
} from '../use-lock-saving-while-uploading';

const mockEditor = {
	lockPostSaving: jest.fn(),
	unlockPostSaving: jest.fn(),
	lockPostAutosaving: jest.fn(),
	unlockPostAutosaving: jest.fn(),
};
const mockNotices = { createWarningNotice: jest.fn(), removeNotice: jest.fn() };
let mockHasEditorStore = true;

jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: store => {
		if ( store === 'core/editor' ) {
			return mockHasEditorStore ? mockEditor : undefined;
		}
		return mockNotices;
	},
} ) );

describe( 'useLockSavingWhileUploading', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockHasEditorStore = true;
	} );

	it( 'locks saving and autosaving while uploading and unlocks when done', () => {
		const { rerender } = renderHook(
			( { uploading } ) => useLockSavingWhileUploading( uploading ),
			{
				initialProps: { uploading: true },
			}
		);
		const lockName = mockEditor.lockPostSaving.mock.calls[ 0 ][ 0 ];

		expect( mockEditor.lockPostAutosaving ).toHaveBeenCalledWith( lockName );
		expect( mockNotices.createWarningNotice ).toHaveBeenCalledWith( expect.any( String ), {
			id: UPLOAD_IN_PROGRESS_NOTICE_ID,
			isDismissible: false,
		} );

		rerender( { uploading: false } );
		expect( mockEditor.unlockPostSaving ).toHaveBeenCalledWith( lockName );
		expect( mockEditor.unlockPostAutosaving ).toHaveBeenCalledWith( lockName );
		expect( mockNotices.removeNotice ).toHaveBeenCalledWith( UPLOAD_IN_PROGRESS_NOTICE_ID );
	} );

	it( 'keeps the notice until the last upload is released', () => {
		const { unmount: unmountFirst } = renderHook( () => useLockSavingWhileUploading( true ) );
		const { unmount: unmountSecond } = renderHook( () => useLockSavingWhileUploading( true ) );
		const [ [ firstLock ], [ secondLock ] ] = mockEditor.lockPostSaving.mock.calls;
		expect( firstLock ).not.toBe( secondLock );

		unmountFirst();
		expect( mockEditor.unlockPostSaving ).toHaveBeenCalledWith( firstLock );
		expect( mockNotices.removeNotice ).not.toHaveBeenCalled();

		unmountSecond();
		expect( mockNotices.removeNotice ).toHaveBeenCalledWith( UPLOAD_IN_PROGRESS_NOTICE_ID );
	} );

	it( 'does nothing without the editor store', () => {
		mockHasEditorStore = false;
		renderHook( () => useLockSavingWhileUploading( true ) );
		expect( mockNotices.createWarningNotice ).not.toHaveBeenCalled();
	} );
} );
