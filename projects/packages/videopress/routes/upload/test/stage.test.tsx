import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem } from '../../../src/dashboard/test-utils/library-item';
import {
	createTestQueryClient,
	createTestWrapper,
} from '../../../src/dashboard/test-utils/query-client-wrapper';
import { stage as Stage } from '../stage';
import type { LibraryItem } from '../../../src/dashboard/types/library';
import type { QueryClient } from '@tanstack/react-query';
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

// The full dashboard chrome (masthead, tabs, landing redirect) is not under
// test; reduce it to a passthrough so the step flow is the whole page.
jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );

// The stage's own QueryClientWrapper carries the window-singleton client and
// the connection gate; swap in a per-test client so cache state can't leak
// between tests.
let mockTestClient: QueryClient;
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => {
	const { QueryClientProvider } = jest.requireActual( '@tanstack/react-query' );
	return {
		__esModule: true,
		default: ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ mockTestClient }>{ children }</QueryClientProvider>
		),
	};
} );

let mockConnected = true;
jest.mock( '../../../src/dashboard/utils/connection', () => ( {
	isWpcomConnected: () => mockConnected,
} ) );

const defaultFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0 };
let mockFreeTier = defaultFreeTier;
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => mockFreeTier,
} ) );

const mockMarkFirstPublish = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-first-run-state', () => ( {
	useFirstRunState: () => 'home',
	markFirstPublish: () => mockMarkFirstPublish(),
} ) );

// The shared tus queue, reduced to a synchronous fake: startUpload appends a
// row whose state each test scripts via mockNextUpload. Progress is the
// queue's native 0..1.
type MockQueueItem = {
	id: string;
	file: File;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'failed';
	error?: string;
	media?: { id: number; guid: string; src: string };
	context?: string;
};
let mockQueue: MockQueueItem[] = [];
let mockNextUpload: Partial< MockQueueItem > = {};
const mockStartUpload = jest.fn( ( file: File ): string => {
	const id = `q-${ mockQueue.length + 1 }`;
	mockQueue.push( { id, file, progress: 0.42, status: 'uploading', ...mockNextUpload } );
	return id;
} );
const mockRetryUpload = jest.fn();
const mockAcknowledgeUpload = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: mockStartUpload,
		retryUpload: mockRetryUpload,
		acknowledgeUpload: mockAcknowledgeUpload,
	} ),
} ) );

// The bound record the edit step resolves once the queue reports a media id.
// The mocked useVideo honors the hook's enabled-gate: no id, no video.
let mockVideo: LibraryItem | undefined;
jest.mock( '../../../src/dashboard/hooks/use-video', () => ( {
	useVideo: ( id: number | string ) => ( {
		video: id ? mockVideo : undefined,
		isLoading: false,
	} ),
	useInvalidateVideo: () => jest.fn(),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-update-video-meta', () => ( {
	useUpdateVideoMeta: () => ( { mutate: jest.fn(), isPending: false } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-update-chapters', () => ( {
	useUpdateChapters: () => ( { syncChapters: jest.fn() } ),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-delete-video', () => ( {
	useDeleteVideo: () => ( { mutateAsync: jest.fn(), isPending: false } ),
} ) );
const mockCreateInfoNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: mockCreateInfoNotice,
	} ),
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => <div data-testid="caption-manager-modal" />,
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/use-video-tracks', () => ( {
	getVideoInfoQueryKeyPrefix: ( guid: string ) => [ 'video-info', guid ],
} ) );

// The edit surface itself is covered by editor.test.tsx; here only the
// routing and the session the stage feeds it matter, so the mock surfaces
// the uploadSession as inspectable attributes.
jest.mock( '../../../src/dashboard/components/video-details/editor', () => ( {
	__esModule: true,
	default: ( {
		uploadSession,
	}: {
		uploadSession?: {
			uploadState?: { status: string; onRetry?: () => void };
			celebration?: { onDismiss: () => void };
		};
	} ) => (
		<div
			data-testid="editor"
			data-upload-status={ uploadSession?.uploadState?.status ?? 'none' }
			data-celebrating={ uploadSession?.celebration ? 'true' : 'false' }
		>
			{ uploadSession?.uploadState?.onRetry && (
				<button onClick={ uploadSession.uploadState.onRetry }>retry</button>
			) }
		</div>
	),
} ) );

const makeFile = ( name: string ) => new File( [ 'x' ], name, { type: 'video/mp4' } );

/**
 * Render the stage inside the per-test query client.
 *
 * @return The render result.
 */
function renderStage() {
	return render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );
}

/**
 * Feed files through the flow's hidden picker input — the same `onFiles`
 * entry the dropzone uses.
 *
 * @param container - The rendered stage's container.
 * @param files     - Files to select.
 */
async function dropFiles( container: HTMLElement, files: File[] ) {
	// eslint-disable-next-line testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
	const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
	await userEvent.upload( input, files );
}

describe( 'upload stage single-drop transition', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockTestClient = createTestQueryClient();
		mockQueue = [];
		mockNextUpload = {};
		mockConnected = true;
		mockVideo = undefined;
		mockFreeTier = defaultFreeTier;
	} );

	it( 'cross-fades a single connected drop straight to the edit surface', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'uploading' );
		// The interstitial card is skipped entirely for the single-file path.
		expect( screen.queryByText( 'Uploading your video' ) ).not.toBeInTheDocument();
	} );

	it( 'starts every file in the shared queue and lands a connected multi-drop on the Library', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/' } );
		// Neither the edit surface nor the 'uploading' interstitial claims a
		// connected multi-drop — the Library's in-flight rows and the upload
		// pill are the batch's progress surface.
		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Uploading 2 videos' ) ).not.toBeInTheDocument();
	} );

	it( 'surfaces the free-plan slice with the discarded count', () => {
		mockFreeTier = { isAtLimit: false, isFree: true, isUnlimited: false, videoCount: 0 };
		const { container } = renderStage();

		// Through the dropzone, not the picker: the free-plan picker input has
		// no `multiple`, so userEvent.upload would deliver a single file and
		// there'd be nothing to slice.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, {
			dataTransfer: {
				files: [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ), makeFile( 'three.mp4' ) ],
			},
		} );

		// Only the first file uploads; the other two are named in the notice.
		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateInfoNotice ).toHaveBeenCalledWith(
			'The free plan includes one video — uploading your first. Upgrade to add the other 2.'
		);
		expect( screen.getByTestId( 'editor' ) ).toBeInTheDocument();
	} );

	it( 'routes a failed single upload retry through the shared queue', async () => {
		mockNextUpload = { status: 'failed', error: 'The connection dropped.' };
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'failed' );
		await userEvent.click( screen.getByText( 'retry' ) );
		expect( mockRetryUpload ).toHaveBeenCalledWith( 'q-1' );
	} );

	it( 'binds to the settled upload and celebrates when playable', async () => {
		// The upload finishes instantly and the bound record is already
		// playable, so the settle chain runs in one pass: bind → celebration
		// + first-publish flag. The queue row is deliberately NOT
		// acknowledged here — it carries the attachment id for the whole
		// session so a mid-session remount (the first-run tab flip) can
		// re-derive it; the flow's exit paths own the acknowledgement.
		mockNextUpload = {
			status: 'success',
			progress: 1,
			media: { id: 77, guid: 'g77', src: 'https://example.com/v.mp4' },
		};
		mockVideo = makeLibraryItem( { id: '77', guid: 'g77', isProcessing: false } );
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		const editor = screen.getByTestId( 'editor' );
		expect( mockAcknowledgeUpload ).not.toHaveBeenCalled();
		expect( editor ).toHaveAttribute( 'data-upload-status', 'none' );
		expect( editor ).toHaveAttribute( 'data-celebrating', 'true' );
		expect( mockMarkFirstPublish ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'resumes into the edit step when exactly one queue item is adopted on mount', () => {
		// The Home emptied-library hand-off: the file is already uploading in
		// the shared queue under this flow's context tag when the route mounts.
		mockQueue = [
			{
				id: 'q-adopted',
				file: makeFile( 'from-home.mp4' ),
				progress: 0.42,
				status: 'uploading',
				context: 'upload-onboarding',
			},
		];

		renderStage();

		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'uploading' );
		expect( mockStartUpload ).not.toHaveBeenCalled();
	} );

	it( 'leaves an adopted multi-item batch on the upload step', () => {
		// Arrival mid-batch: multi-drops navigate to the Library, so the flow
		// never claims them — the dropzone renders and the batch stays with
		// the Library rows and the pill.
		mockQueue = [
			{
				id: 'q-a',
				file: makeFile( 'a.mp4' ),
				progress: 0.1,
				status: 'uploading',
				context: 'upload-onboarding',
			},
			{
				id: 'q-b',
				file: makeFile( 'b.mp4' ),
				progress: 0,
				status: 'pending',
				context: 'upload-onboarding',
			},
		];

		renderStage();

		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
	} );
} );
