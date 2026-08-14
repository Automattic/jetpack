import { act, render } from '@testing-library/react';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { Action, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
	useSearch: () => ( {} ),
	useLinkProps: ( { to }: { to: string } ) => ( { href: to } ),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// The grid itself is not under test; capture the props the stage feeds it so
// the delete callback and the spliced rows can be inspected directly.
type CapturedProps = { data: LibraryItem[]; actions: Action< LibraryItem >[] };
let mockDataViewsProps: CapturedProps | null = null;
jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	...jest.requireActual( '@wordpress/dataviews' ),
	DataViews: ( props: CapturedProps ) => {
		mockDataViewsProps = props;
		return <div data-testid="dataviews" />;
	},
} ) );

jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => <div data-testid="caption-manager-modal" />,
} ) );

let mockLibraryTotal = 3;
let mockItems: LibraryItem[] = [];
jest.mock( '../../../src/dashboard/hooks/use-library', () => ( {
	LIBRARY_QUERY_KEY: 'videopress-library',
	useLibrary: () => ( {
		items: mockItems,
		isLoading: false,
		isError: false,
		error: null,
		paginationInfo: { totalItems: mockLibraryTotal, totalPages: 1 },
		refetch: jest.fn(),
	} ),
} ) );

let mockQueue: Array< Record< string, unknown > > = [];
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: jest.fn(),
		retryUpload: jest.fn(),
		cancelUpload: jest.fn(),
		acknowledgeUpload: jest.fn(),
	} ),
} ) );

const mockDeleteVideo = jest.fn( () => Promise.resolve() );
jest.mock( '../../../src/dashboard/hooks/use-delete-video', () => ( {
	...jest.requireActual( '../../../src/dashboard/hooks/use-delete-video' ),
	useDeleteVideo: () => ( { mutateAsync: mockDeleteVideo } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => ( {
		isAtLimit: false,
		isFree: false,
		isUnlimited: true,
		videoCount: 3,
		limit: 1,
	} ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-set-privacy', () => ( {
	useSetPrivacy: () => ( { mutateAsync: jest.fn() } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-upload-from-library', () => ( {
	useUploadFromLibrary: () => ( { mutateAsync: jest.fn() } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => jest.fn(),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-persisted-view', () => ( {
	usePersistedView: ( fallback: View ) => [ fallback, jest.fn() ],
} ) );
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
	} ),
} ) );

/**
 * Mount the stage and pull out the DataViews delete action it built.
 *
 * @return The delete action.
 */
function mountAndGetDeleteAction() {
	render( <Stage /> );
	const action = mockDataViewsProps?.actions.find( item => item.id === 'delete' );
	if ( ! action || ! ( 'callback' in action ) ) {
		throw new Error( 'delete action missing' );
	}
	return action;
}

describe( 'library stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockDataViewsProps = null;
		mockItems = [];
		mockQueue = [];
		mockLibraryTotal = 3;
	} );

	describe( 'delete', () => {
		it( 'confirms with the batch count and does nothing when declined', async () => {
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' }, { id: '2' } ] as LibraryItem[], {} as never );
			} );

			// One prompt for the whole batch, naming the count — not one per row.
			expect( confirmSpy ).toHaveBeenCalledWith( 'Permanently delete 2 videos?' );
			expect( mockDeleteVideo ).not.toHaveBeenCalled();
			confirmSpy.mockRestore();
		} );

		it( 'uses the singular prompt for one video and deletes on approval', async () => {
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' } ] as LibraryItem[], {} as never );
			} );

			expect( confirmSpy ).toHaveBeenCalledWith( 'Permanently delete 1 video?' );
			expect( mockDeleteVideo ).toHaveBeenCalledWith( [ '1' ] );
			confirmSpy.mockRestore();
		} );

		it( 'lands on Home when the batch empties the library', async () => {
			mockLibraryTotal = 2;
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' }, { id: '2' } ] as LibraryItem[], {} as never );
			} );

			// The emptied grid is a dead end — no dropzone, nothing to do next.
			expect( mockNavigate ).toHaveBeenCalledWith( { href: '/home' } );
			confirmSpy.mockRestore();
		} );

		it( 'stays on the Library while other videos remain', async () => {
			mockLibraryTotal = 9;
			const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( true );
			const action = mountAndGetDeleteAction();

			await act( async () => {
				await action.callback?.( [ { id: '1' } ] as LibraryItem[], {} as never );
			} );

			expect( mockNavigate ).not.toHaveBeenCalled();
			confirmSpy.mockRestore();
		} );
	} );

	it( 'dates a spliced in-flight row by its enqueue time', () => {
		mockQueue = [
			{
				id: 'q-1',
				file: new File( [ 'x' ], 'clip.mp4', { type: 'video/mp4' } ),
				progress: 0.4,
				status: 'uploading',
				enqueuedAt: '2026-01-01T00:00:00.000Z',
			},
		];

		render( <Stage /> );

		// A date rebuilt on every render walks forward while the row is on
		// screen, and this listing sorts by it.
		expect( mockDataViewsProps?.data[ 0 ].uploadDate ).toBe( '2026-01-01T00:00:00.000Z' );
	} );
} );
