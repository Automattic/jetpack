import { render, screen } from '@testing-library/react';
import { makeVideoFile } from '../../../src/dashboard/test-utils/video-file';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
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
// the viewport.
jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	...jest.requireActual( '@wordpress/dataviews' ),
	DataViews: () => <div data-testid="dataviews" />,
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

// `null` models the in-flight count: useLibrary reports no paginationInfo
// until the request answers.
let mockLibraryTotal: number | null = 3;
let mockItems: LibraryItem[] = [];
let mockIsError = false;
jest.mock( '../../../src/dashboard/hooks/use-library', () => ( {
	LIBRARY_QUERY_KEY: 'videopress-library',
	useLibrary: () => ( {
		items: mockItems,
		isLoading: mockLibraryTotal === null,
		isError: mockIsError,
		error: null,
		paginationInfo:
			mockLibraryTotal === null ? undefined : { totalItems: mockLibraryTotal, totalPages: 1 },
		refetch: jest.fn(),
	} ),
} ) );

let mockQueue: Array< { id: string; status: string; progress: number; file: File } > = [];
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
		mockIsError = false;
		mockFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0, limit: 1 };
	} );

	it( 'starts in a loading state while the count request is in flight', () => {
		// The initial render must not guess: neither the grid skeleton nor the
		// dropzone paints until the unfiltered count answers.
		mockLibraryTotal = null;

		render( <Stage /> );

		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'dataviews' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the upload dropzone instead of the grid when the library is empty', () => {
		mockLibraryTotal = 0;

		render( <Stage /> );

		expect( screen.getByText( 'Upload your first video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'dataviews' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the listing while videos exist', () => {
		render( <Stage /> );

		expect( screen.queryByText( 'Upload your first video' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
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
