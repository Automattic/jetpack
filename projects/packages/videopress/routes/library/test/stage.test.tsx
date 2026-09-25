import { render, screen, within } from '@testing-library/react';
import { makeLibraryItem } from '../../../src/dashboard/test-utils/library-item';
import { makeVideoFile } from '../../../src/dashboard/test-utils/video-file';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
} ) );

// The grid itself is not under test; a stand-in marks whether the listing owns
// the viewport and which rows it was handed.
jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	...jest.requireActual( '@wordpress/dataviews' ),
	DataViews: ( { data, isLoading }: { data: LibraryItem[]; isLoading: boolean } ) => (
		<ul data-testid="dataviews" aria-busy={ isLoading }>
			{ data.map( item => (
				<li key={ item.id }>{ item.id }</li>
			) ) }
		</ul>
	),
} ) );

jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: ReactNode; actions?: ReactNode } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => null,
} ) );

let mockLibraryTotal = 3;
let mockItems: LibraryItem[] = [];
let mockIsLoading = false;
let mockIsTotalLoading = false;
let mockIsError = false;
let mockIsTotalError = false;
const mockUseLibrary = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-library', () => ( {
	LIBRARY_QUERY_KEY: 'videopress-library',
	useLibrary: ( view: View, ...rest: unknown[] ) => {
		mockUseLibrary( view, ...rest );
		return {
			items: mockItems,
			isLoading: view.perPage === 1 ? mockIsTotalLoading : mockIsLoading,
			isError: view.perPage === 1 ? mockIsTotalError : mockIsError,
			error: null,
			paginationInfo: { totalItems: mockLibraryTotal, totalPages: mockLibraryTotal ? 1 : 0 },
			refetch: jest.fn(),
		};
	},
} ) );

let mockQueue: Array< {
	id: string;
	status: string;
	progress: number;
	file: File;
	mediaId?: string;
} > = [];
const mockStartUpload = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: ( ...args: unknown[] ) => mockStartUpload( ...args ),
		retryUpload: jest.fn(),
		cancelUpload: jest.fn(),
		acknowledgeUpload: jest.fn(),
	} ),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-delete-video', () => ( {
	...jest.requireActual( '../../../src/dashboard/hooks/use-delete-video' ),
	useDeleteVideo: () => ( { mutateAsync: jest.fn() } ),
} ) );
let mockFreeTier = {
	isAtLimit: false,
	isFree: false,
	isUnlimited: true,
	videoCount: 0,
	limit: 1,
};
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => mockFreeTier,
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
	usePersistedView: ( fallback: unknown ) => [ fallback, jest.fn() ],
} ) );
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
	} ),
} ) );

describe( 'library stage empty state', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockItems = [];
		mockQueue = [];
		mockLibraryTotal = 3;
		mockIsLoading = false;
		mockIsTotalLoading = false;
		mockIsError = false;
		mockIsTotalError = false;
		mockFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0, limit: 1 };
	} );

	it.each( [
		[ 'both requests are pending', true, true ],
		[ 'the count finishes first', true, false ],
		[ 'the listing finishes first', false, true ],
	] )( 'keeps DataViews loading when %s', ( _label, listingLoading, countLoading ) => {
		mockLibraryTotal = 0;
		mockIsLoading = listingLoading;
		mockIsTotalLoading = countLoading;

		const { rerender } = render( <Stage /> );

		expect( screen.getByTestId( 'dataviews' ) ).toHaveAttribute( 'aria-busy', 'true' );
		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();

		mockIsLoading = false;
		mockIsTotalLoading = false;
		rerender( <Stage /> );

		expect( screen.getByText( 'Upload your first video' ) ).toBeInTheDocument();
	} );

	it( 'shows fetched videos without waiting for the count', () => {
		mockLibraryTotal = 0;
		mockIsTotalLoading = true;
		mockItems = [ makeLibraryItem() ];

		render( <Stage /> );

		expect( screen.getByTestId( 'dataviews' ) ).toHaveAttribute( 'aria-busy', 'false' );
		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
	} );

	it( 'does not treat a failed count as an empty library', () => {
		mockLibraryTotal = 0;
		mockIsTotalError = true;

		render( <Stage /> );

		expect( screen.getByTestId( 'dataviews' ) ).toHaveAttribute( 'aria-busy', 'false' );
		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the upload dropzone instead of the grid when the library is empty', () => {
		mockLibraryTotal = 0;

		render( <Stage /> );

		expect( screen.getByText( 'Upload your first video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'dataviews' ) ).not.toBeInTheDocument();
		// The dropzone is the upload affordance here; the header must not
		// offer a second button for the same action.
		expect( screen.queryByRole( 'button', { name: 'Upload video' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the listing while videos exist', () => {
		render( <Stage /> );

		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();
	} );

	it( 'hands the surface to the listing the moment an upload is queued', () => {
		// The listing splices in-flight queue rows in at the top, so it owns
		// the viewport as soon as anything is uploading — even though the
		// persisted count still reads zero.
		mockLibraryTotal = 0;
		mockQueue = [
			{ id: 'q1', status: 'uploading', progress: 0.4, file: makeVideoFile( 'a.mp4' ) },
		];

		render( <Stage /> );

		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();
	} );

	it( 'never masks a failed listing request with the empty state', () => {
		// A failed count/listing read is indistinguishable from an empty
		// library by numbers alone; the error surface must win.
		mockLibraryTotal = 0;
		mockIsError = true;

		render( <Stage /> );

		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'We couldn’t load your video library.' ) ).toBeInTheDocument();
	} );

	it( 'offers a single-file picker on the capped free tier', () => {
		mockLibraryTotal = 0;
		mockFreeTier = { isAtLimit: false, isFree: true, isUnlimited: false, videoCount: 0, limit: 1 };

		render( <Stage /> );

		// The dropzone's copy follows `allowMultiple`, which follows the plan.
		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
	} );
} );

describe( 'library stage upload hand-off', () => {
	const renderedRowIds = () =>
		within( screen.getByTestId( 'dataviews' ) )
			.queryAllByRole( 'listitem' )
			.map( row => row.textContent );

	beforeEach( () => {
		jest.clearAllMocks();
		mockLibraryTotal = 1;
		mockIsLoading = false;
		mockIsTotalLoading = false;
		mockIsError = false;
		mockIsTotalError = false;
		mockItems = [ makeLibraryItem( { id: '7' } ) ];
		mockQueue = [];
		mockFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0, limit: 1 };
	} );

	it.each( [
		[ 'keeps polling while bytes are still being sent', 0.5, true ],
		[ 'holds off polling once every byte is sent and the server is finishing up', 1, false ],
	] )( '%s', ( _label, progress, poll ) => {
		mockQueue = [ { id: 'q1', status: 'uploading', progress, file: makeVideoFile( 'a.mp4' ) } ];

		render( <Stage /> );

		expect( mockUseLibrary ).toHaveBeenCalledWith( expect.objectContaining( { perPage: 12 } ), {
			poll,
		} );
	} );

	it( 'keeps a finished upload’s row until the listing has its attachment, then shows only that', () => {
		mockQueue = [
			{
				id: 'q1',
				status: 'success',
				progress: 1,
				mediaId: '101',
				file: makeVideoFile( 'a.mp4' ),
			},
		];

		const { rerender } = render( <Stage /> );
		expect( renderedRowIds() ).toEqual( [ 'q1', '7' ] );

		mockItems = [ makeLibraryItem( { id: '101', isProcessing: true } ), ...mockItems ];
		rerender( <Stage /> );
		expect( renderedRowIds() ).toEqual( [ '101', '7' ] );
	} );
} );
