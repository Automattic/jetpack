import { fireEvent, render, screen } from '@testing-library/react';
import { makeVideoFile, settleFileCheck } from '../../../src/dashboard/test-utils/video-file';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
	Link: ( { children }: { children: ReactNode } ) => <a href="/">{ children }</a>,
} ) );

// The full dashboard chrome is not under test; reduce it to a passthrough
// that surfaces the header actions so their contents stay assertable.
jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: ReactNode; actions?: ReactNode } ) => (
		<div>
			<div data-testid="header-actions">{ actions }</div>
			{ children }
		</div>
	),
} ) );

jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '../../../src/dashboard/components/overview/free-tier-notice', () => ( {
	__esModule: true,
	default: () => <div data-testid="free-tier-notice" />,
} ) );

jest.mock( '../recent-video-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="recent-video-card" />,
} ) );

let mockItems: LibraryItem[] = [];
let mockLibraryIsLoading = false;
jest.mock( '../../../src/dashboard/hooks/use-library', () => ( {
	useLibrary: () => ( {
		items: mockItems,
		isLoading: mockLibraryIsLoading,
		isError: false,
		error: undefined,
		refetch: jest.fn(),
	} ),
} ) );

const defaultFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0 };
let mockFreeTier = defaultFreeTier;
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => mockFreeTier,
} ) );

jest.mock( '../../../src/dashboard/hooks/use-stats', () => ( {
	TOP_VIDEOS_LIMIT: 10,
	useStats: () => ( {
		stats: { topVideos: [] },
		isError: false,
		hasData: false,
	} ),
} ) );

const mockStartUpload = jest.fn( ( file: File ): string => `q-${ file.name }` );
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: [],
		startUpload: mockStartUpload,
		retryUpload: jest.fn(),
		cancelUpload: jest.fn(),
		acknowledgeUpload: jest.fn(),
	} ),
} ) );

const mockCreateInfoNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: mockCreateInfoNotice,
	} ),
} ) );

// Real container bytes: the dropzone's filter reads the header and checks it
// against the extension, so `[ 'x' ]` is no longer a video.
const makeFile = ( name: string ) => makeVideoFile( name );

/**
 * Drop files on the empty state's dropzone, then wait for the accepted-file
 * check to settle — it reads each file's header, so the hand-off is a task
 * later than the drop.
 *
 * @param container - The rendered stage's container.
 * @param files     - Files to drop.
 */
async function dropOnDropzone( container: HTMLElement, files: File[] ) {
	// eslint-disable-next-line testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
	const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
	fireEvent.drop( dropzone, { dataTransfer: { files } } );
	await settleFileCheck();
}

describe( 'home stage empty state', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockItems = [];
		mockLibraryIsLoading = false;
		mockFreeTier = defaultFreeTier;
	} );

	it( 'renders the dropzone as the whole empty state — no shell, no section head', () => {
		const { container } = render( <Stage /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the surface exists, not interacting with it.
		expect( container.querySelector( '.vp-upload-dropzone' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your video here' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your video will show up here, ready to share or drop into a post.' )
		).toBeInTheDocument();

		// The old EmptyState heading/description are gone; the visible copy
		// belongs to the dropzone alone.
		expect( screen.queryByText( 'No videos yet' ) ).not.toBeInTheDocument();
		// A "Recent videos" label over no recents is suppressed with it.
		expect( screen.queryByText( 'Recent videos' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps a visually-hidden heading announcing the no-videos status', () => {
		render( <Stage /> );

		expect(
			screen.getByRole( 'heading', { name: 'No videos yet — upload a video' } )
		).toBeInTheDocument();
	} );

	it( 'hides the header upload action while the empty-state dropzone is on screen', () => {
		render( <Stage /> );

		expect( screen.getByTestId( 'header-actions' ) ).toBeEmptyDOMElement();
	} );

	it( 'shows no upload action while the library is still loading', () => {
		mockLibraryIsLoading = true;
		const { container } = render( <Stage /> );

		// Neither surface may flash in before the listing settles: no header
		// button, no dropzone — just the skeleton rail under its heading.
		expect( screen.getByTestId( 'header-actions' ) ).toBeEmptyDOMElement();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the surface is absent, not interacting with it.
		expect( container.querySelector( '.vp-upload-dropzone' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Recent videos' ) ).toBeInTheDocument();
	} );

	it( 'keeps the header to the upload action alone once the library has videos', () => {
		mockItems = [ { id: '1' } as LibraryItem ];
		render( <Stage /> );

		const actions = screen.getByTestId( 'header-actions' );
		expect( actions ).toHaveTextContent( 'Upload video' );
		expect( actions ).not.toHaveTextContent( 'Add to a post or page' );
	} );

	it( 'starts a dropped file under the onboarding context and resumes /upload', async () => {
		const { container } = render( <Stage /> );

		const file = makeFile( 'one.mp4' );
		await dropOnDropzone( container, [ file ] );

		expect( mockStartUpload ).toHaveBeenCalledWith( file, 'upload-onboarding' );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/upload' } );
	} );

	it( 'hands a multi-file drop to the Library, every file in the queue', async () => {
		const { container } = render( <Stage /> );

		await dropOnDropzone( container, [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/' } );
		// The batch tag, not the single flow's: /upload must not adopt these as
		// a session, and only one of them is a first-upload worth announcing.
		expect( mockStartUpload ).toHaveBeenCalledWith( expect.anything(), 'upload-batch' );
	} );

	it( 'slices a free-plan drop to one file and surfaces the discarded count', async () => {
		mockFreeTier = { isAtLimit: false, isFree: true, isUnlimited: false, videoCount: 0 };
		const { container } = render( <Stage /> );

		await dropOnDropzone( container, [ makeFile( 'a.mp4' ), makeFile( 'b.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateInfoNotice ).toHaveBeenCalledWith(
			'The free plan includes one video — uploading your first. Upgrade to add 1 more.'
		);
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/upload' } );
	} );

	it( 'shows no dropzone while the library has videos', () => {
		mockItems = [ { id: '1' } as LibraryItem ];
		const { container } = render( <Stage /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the surface is absent, not interacting with it.
		expect( container.querySelector( '.vp-upload-dropzone' ) ).not.toBeInTheDocument();
		// The section head returns with the recents it labels.
		expect( screen.getByText( 'Recent videos' ) ).toBeInTheDocument();
	} );
} );
