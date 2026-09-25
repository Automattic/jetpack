import { renderHook } from '@testing-library/react';
import { syncChapters as syncChaptersCore } from '../../../client/utils/video-chapters/sync-chapters';
import { makeLibraryItem } from '../../test-utils/library-item';
import { useUpdateChapters } from '../use-update-chapters';

// The pipeline itself (fetch item, manual-VTT guard, delete/generate/upload,
// error envelopes) is covered by the shared core's own tests; this file only
// pins the dashboard wrapper's wiring.
jest.mock( '../../../client/utils/video-chapters/sync-chapters', () => ( {
	__esModule: true,
	syncChapters: jest.fn(),
} ) );
const mockedSyncChaptersCore = syncChaptersCore as jest.Mock;

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting restrictions.
const mockWarningNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createWarningNotice: mockWarningNotice,
	} ),
} ) );

const VIDEO = makeLibraryItem( { guid: 'abc123', isPrivate: false, durationSeconds: 90 } );
const DESCRIPTION = '00:00 Intro\n00:30 Editing\n01:00 Export';

describe( 'useUpdateChapters', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockedSyncChaptersCore.mockResolvedValue( 'uploaded' );
	} );

	it( 'delegates to the shared sync core and resolves with its status', async () => {
		const { result } = renderHook( () => useUpdateChapters() );

		await expect( result.current.syncChapters( VIDEO, DESCRIPTION ) ).resolves.toBe( 'uploaded' );

		expect( mockedSyncChaptersCore ).toHaveBeenCalledWith( VIDEO, DESCRIPTION, {
			onWarning: expect.any( Function ),
		} );
	} );

	it( 'surfaces the core’s warnings as dashboard warning notices', async () => {
		mockedSyncChaptersCore.mockImplementation(
			( _video, _description, options: { onWarning: ( message: string ) => void } ) => {
				options.onWarning( 'Video chapters could not be updated.' );
				return Promise.resolve( 'error' );
			}
		);
		const { result } = renderHook( () => useUpdateChapters() );

		await expect( result.current.syncChapters( VIDEO, DESCRIPTION ) ).resolves.toBe( 'error' );

		expect( mockWarningNotice ).toHaveBeenCalledWith( 'Video chapters could not be updated.' );
	} );

	it( 'passes every non-error status through untouched', async () => {
		const { result } = renderHook( () => useUpdateChapters() );

		for ( const status of [ 'deleted', 'skipped-manual', 'unchanged' ] as const ) {
			mockedSyncChaptersCore.mockResolvedValue( status );
			await expect( result.current.syncChapters( VIDEO, DESCRIPTION ) ).resolves.toBe( status );
		}
		expect( mockWarningNotice ).not.toHaveBeenCalled();
	} );
} );
