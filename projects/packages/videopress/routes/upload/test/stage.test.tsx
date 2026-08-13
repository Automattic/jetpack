import { render, screen } from '@testing-library/react';
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

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => jest.fn(),
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

jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: () => ( { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0 } ),
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
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
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
	} );

	it( 'cross-fades a single connected drop straight to the edit surface', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'uploading' );
		// The interstitial card is skipped entirely for the single-file path.
		expect( screen.queryByText( 'Uploading your video' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the uploading card for multi-file drops', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Uploading 2 videos' ) ).toBeInTheDocument();
	} );

	it( 'routes a failed single upload retry through the shared queue', async () => {
		mockNextUpload = { status: 'failed', error: 'The connection dropped.' };
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'failed' );
		await userEvent.click( screen.getByText( 'retry' ) );
		expect( mockRetryUpload ).toHaveBeenCalledWith( 'q-1' );
	} );

	it( 'binds to the settled upload, acknowledges it, and celebrates when playable', async () => {
		// The upload finishes instantly and the bound record is already
		// playable, so the whole settle chain runs in one pass: bind →
		// acknowledge → celebration + first-publish flag.
		mockNextUpload = {
			status: 'success',
			progress: 1,
			media: { id: 77, guid: 'g77', src: 'https://example.com/v.mp4' },
		};
		mockVideo = makeLibraryItem( { id: '77', guid: 'g77', isProcessing: false } );
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		const editor = screen.getByTestId( 'editor' );
		expect( mockAcknowledgeUpload ).toHaveBeenCalledWith( 'q-1' );
		expect( editor ).toHaveAttribute( 'data-upload-status', 'none' );
		expect( editor ).toHaveAttribute( 'data-celebrating', 'true' );
		expect( mockMarkFirstPublish ).toHaveBeenCalledTimes( 1 );
	} );
} );
