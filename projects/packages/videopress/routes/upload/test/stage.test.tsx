import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem } from '../../../src/dashboard/test-utils/library-item';
import {
	createTestQueryClient,
	createTestWrapper,
} from '../../../src/dashboard/test-utils/query-client-wrapper';
import {
	makeRenamedTextFile,
	makeVideoFile,
	settleFileCheck,
} from '../../../src/dashboard/test-utils/video-file';
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
// test; reduce it to a passthrough that still reports which tab the stage
// claims — the at-limit remount bug lived in exactly that value.
jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children, activeTab }: { children: ReactNode; activeTab: string } ) => (
		<div data-testid="layout" data-active-tab={ activeTab }>
			{ children }
		</div>
	),
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
	enqueuedAt: string;
	draft?: { title?: string };
};
let mockQueue: MockQueueItem[] = [];
let mockNextUpload: Partial< MockQueueItem > = {};
const mockStartUpload = jest.fn( ( file: File ): string => {
	const id = `q-${ mockQueue.length + 1 }`;
	mockQueue.push( {
		id,
		file,
		progress: 0.42,
		status: 'uploading',
		enqueuedAt: '2026-01-01T00:00:00.000Z',
		...mockNextUpload,
	} );
	return id;
} );
const mockRetryUpload = jest.fn();
const mockAcknowledgeUpload = jest.fn();
const mockSetUploadDraft = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-upload', () => ( {
	useUpload: () => ( {
		uploadQueue: mockQueue,
		startUpload: mockStartUpload,
		retryUpload: mockRetryUpload,
		acknowledgeUpload: mockAcknowledgeUpload,
	} ),
	// Mirrors the real predicate rather than importing it: the adoption rule
	// (never re-adopt a settled success) is what these tests are pinning.
	isAdoptableUpload: ( item: MockQueueItem ) =>
		item.status === 'pending' || item.status === 'uploading' || item.status === 'failed',
	setUploadDraft: ( id: string, draft: unknown ) => mockSetUploadDraft( id, draft ),
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
const mockCreateErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: ( ...args: unknown[] ) => mockCreateErrorNotice( ...args ),
		createInfoNotice: mockCreateInfoNotice,
	} ),
} ) );
// The dropzone's rejected-drop notice carries the upgrade route; the real hook
// wants the connection package's initial state, which this stage test doesn't
// hydrate.
jest.mock( '../../../src/dashboard/hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => jest.fn(),
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
		embedded,
	}: {
		uploadSession?: {
			uploadState?: { status: string; onRetry?: () => void };
			saveDisabled?: boolean;
			draft?: { title?: string };
			onDraftChange?: ( draft: { title?: string } | undefined ) => void;
		};
		embedded?: boolean;
	} ) => (
		<div
			data-testid="editor"
			data-embedded={ embedded ? 'true' : 'false' }
			data-upload-status={ uploadSession?.uploadState?.status ?? 'none' }
			data-save-disabled={ uploadSession?.saveDisabled ? 'true' : 'false' }
			data-draft-title={ uploadSession?.draft?.title ?? '' }
		>
			{ uploadSession?.uploadState?.onRetry && (
				<button onClick={ uploadSession.uploadState.onRetry }>retry</button>
			) }
			{ uploadSession?.onDraftChange && (
				<button onClick={ () => uploadSession.onDraftChange?.( { title: 'Launch recap' } ) }>
					type a title
				</button>
			) }
		</div>
	),
} ) );

// Real container bytes: the dropzone's filter reads the header and checks it
// against the extension, so `[ 'x' ]` is no longer a video.
const makeFile = ( name: string ) => makeVideoFile( name );

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
 * entry the dropzone uses — and wait for the accepted-file check to settle: it
 * reads each file's header, so the hand-off is a task later than the pick.
 *
 * @param container - The rendered stage's container.
 * @param files     - Files to select.
 */
async function dropFiles( container: HTMLElement, files: File[] ) {
	// eslint-disable-next-line testing-library/no-node-access -- the picker input is visually hidden with no label; no accessible query reaches it.
	const input = container.querySelector( 'input[type="file"]' ) as HTMLInputElement;
	await userEvent.upload( input, files );
	await settleFileCheck();
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

	it( 'hands a single connected drop straight to the edit surface', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'uploading' );
		// The interstitial card is skipped entirely for the single-file path.
		expect( screen.queryByText( 'Uploading your video' ) ).not.toBeInTheDocument();
	} );

	it( 'sequences the drop → editor handover instead of cross-fading it', async () => {
		// The drop zone and the editor share no shape and no line of text, so the
		// cross-fade printed the dropzone's hint and sub-copy over the editor's
		// Description field for ~250ms — at the one moment the product is judged.
		// The class is what routes this pair to the sequenced timing in style.scss.
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the flow wrapper is a styled div with no accessible role.
		const flow = container.querySelector( '.vp-flow' ) as HTMLElement;
		expect( flow ).toHaveClass( 'is-sequenced' );
		// Both cards are still mounted at this point — the sequencing is about
		// WHEN each one paints, not about yanking the outgoing card out.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- as above.
		expect( container.querySelector( '.vp-flow__card.is-exit' ) ).toHaveAttribute(
			'data-step',
			'upload'
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- as above.
		expect( container.querySelector( '.vp-flow__card[data-active="true"]' ) ).toHaveAttribute(
			'data-step',
			'edit'
		);
	} );

	it( 'keeps the cross-fade for a handover between two cards of the same shape', async () => {
		// upload → uploading is card to card, which is what the cross-fade was
		// built for and where it reads well. Fixing the editor handover must not
		// reach this one.
		mockConnected = false;
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the flow wrapper is a styled div with no accessible role.
		const flow = container.querySelector( '.vp-flow' ) as HTMLElement;
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- as above.
		expect( container.querySelector( '.vp-flow__card[data-active="true"]' ) ).toHaveAttribute(
			'data-step',
			'uploading'
		);
		expect( flow ).not.toHaveClass( 'is-sequenced' );
	} );

	it( 'starts every file in the shared queue and lands a connected multi-drop on the Library', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/' } );
		// Tagged apart from the single flow: a batch has no surface of its own,
		// so it must not be adopted as one — nor announced once per file when
		// the user chains through the pill's "Add details".
		expect( mockStartUpload ).toHaveBeenCalledWith( expect.anything(), 'upload-batch' );
		// Neither the edit surface nor the 'uploading' interstitial claims a
		// connected multi-drop — the Library's in-flight rows and the upload
		// pill are the batch's progress surface.
		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Uploading 2 videos' ) ).not.toBeInTheDocument();
	} );

	it( 'surfaces the free-plan slice with the discarded count', async () => {
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
		await settleFileCheck();

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

	it( 'hands off to the video screen once the upload registers', async () => {
		// The design truth: a single upload ends on the real /video/:id
		// screen, not on an embedded copy of it. `replace` because this
		// bridge is not a place to come back to.
		mockNextUpload = {
			status: 'success',
			progress: 1,
			media: { id: 77, guid: 'g77', src: 'https://example.com/v.mp4' },
		};
		mockVideo = makeLibraryItem( { id: '77', guid: 'g77', isProcessing: false } );
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/video/77', replace: true } );
		// The row survives the handoff: it carries the draft to that page,
		// which acknowledges it once the video is playable.
		expect( mockAcknowledgeUpload ).not.toHaveBeenCalled();
		// Both the live notice and the first-publish flag left this step — the
		// flag is written by the queue for every row, this one included.
		expect( mockMarkFirstPublish ).not.toHaveBeenCalled();
	} );

	it( 'holds the bridge while the attachment exists but is not yet registered', async () => {
		// The attachment id resolves, but a GUID-less record maps to type
		// 'local' — which /video/:id renders as NotFound. Navigating on
		// "the id exists" would land the user there.
		mockNextUpload = {
			status: 'success',
			progress: 1,
			media: { id: 77, guid: '', src: 'https://example.com/v.mp4' },
		};
		mockVideo = makeLibraryItem( { id: '77', guid: '', type: 'local', isProcessing: false } );
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

		expect( mockNavigate ).not.toHaveBeenCalled();
		const editor = screen.getByTestId( 'editor' );
		expect( editor ).toHaveAttribute( 'data-upload-status', 'processing' );
		// The meta POST needs a registered video, so Save stays off.
		expect( editor ).toHaveAttribute( 'data-save-disabled', 'true' );
	} );

	it( 'writes the edit session draft through to its queue row', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ) ] );
		await userEvent.click( screen.getByText( 'type a title' ) );

		// The row, not this mount, holds what was typed — which is what lets
		// it survive the handoff and the mid-flow remounts.
		expect( mockSetUploadDraft ).toHaveBeenCalledWith( 'q-1', { title: 'Launch recap' } );
	} );

	it( 'seeds the surface from a draft already on the adopted row', () => {
		mockQueue = [
			{
				id: 'q-adopted',
				file: makeFile( 'from-home.mp4' ),
				progress: 0.42,
				status: 'uploading',
				context: 'upload-onboarding',
				enqueuedAt: '2026-01-01T00:00:00.000Z',
				draft: { title: 'Half typed' },
			},
		];

		renderStage();

		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-draft-title', 'Half typed' );
	} );

	it( 'renders a working upload card for a returning user instead of ejecting', () => {
		// The eject bounced every in-app arrival — Home's header button, the
		// welcome modal's CTA — straight back out for anyone with a library.
		mockFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 7 };

		renderStage();

		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'keeps the Upload tab active at the free-tier limit', () => {
		// activeTab following isAtLimit moved the children into a different
		// Tabs.Panel the moment a free-tier drop entered the queue, remounting
		// the flow mid-upload.
		mockFreeTier = { isAtLimit: true, isFree: true, isUnlimited: false, videoCount: 1 };

		renderStage();

		expect( screen.getByTestId( 'layout' ) ).toHaveAttribute( 'data-active-tab', 'upload' );
	} );

	it( 'says why a drop is refused at the free-tier limit instead of eating it', async () => {
		// The screen still renders a full, normal-looking upload card at the
		// limit. Dropping onto it did nothing at all — no error, no toast, no
		// state change — while the button beside it was plainly disabled.
		mockFreeTier = { isAtLimit: true, isFree: true, isUnlimited: false, videoCount: 1 };
		const { container } = renderStage();

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ makeFile( 'second.mp4' ) ] } } );
		await settleFileCheck();

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
			expect.objectContaining( {
				actions: [ expect.objectContaining( { label: 'Upgrade' } ) ],
			} )
		);
	} );

	it( 'refuses a file that only looks like a video before it can burn a slot', async () => {
		// A `.txt` renamed `.mp4` uploaded 0→100%, registered, took the free
		// plan's one slot and then sat there permanently half-broken. It reports
		// `video/mp4` — Chromium derives the type from the extension — so the
		// MIME check waves it through and only the bytes catch it.
		const { container } = renderStage();

		const impostor = makeRenamedTextFile( 'not-a-video.mp4' );
		expect( impostor.type ).toBe( 'video/mp4' );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the dropzone is a styled div with no accessible role; no query reaches it.
		const dropzone = container.querySelector( '.vp-upload-dropzone' ) as HTMLElement;
		fireEvent.drop( dropzone, { dataTransfer: { files: [ impostor ] } } );
		await settleFileCheck();

		expect( mockStartUpload ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledWith( 'Only video files can be uploaded.', {
			id: 'vp-upload-invalid-file',
		} );
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
				enqueuedAt: '2026-01-01T00:00:00.000Z',
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
				enqueuedAt: '2026-01-01T00:00:00.000Z',
			},
			{
				id: 'q-b',
				file: makeFile( 'b.mp4' ),
				progress: 0,
				status: 'pending',
				context: 'upload-onboarding',
				enqueuedAt: '2026-01-01T00:00:01.000Z',
			},
		];

		renderStage();

		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
	} );

	it( 'never resumes into a settled success row', () => {
		// The haunting: a finished upload nobody acknowledged used to be
		// adopted on arrival, resurrecting the edit session it came from as a
		// permanently "processing" surface.
		mockQueue = [
			{
				id: 'q-done',
				file: makeFile( 'done.mp4' ),
				progress: 1,
				status: 'success',
				context: 'upload-onboarding',
				enqueuedAt: '2026-01-01T00:00:00.000Z',
				media: { id: 77, guid: 'g77', src: 'https://example.com/v.mp4' },
			},
		];
		mockVideo = makeLibraryItem( { id: '77', guid: 'g77', isProcessing: false } );

		renderStage();

		expect( screen.queryByTestId( 'editor' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Drag and drop your videos here' ) ).toBeInTheDocument();
	} );

	it( 'adopts a failed row so a returning user sees the failure once', () => {
		mockQueue = [
			{
				id: 'q-failed',
				file: makeFile( 'nope.mp4' ),
				progress: 0.3,
				status: 'failed',
				error: 'The connection dropped.',
				context: 'upload-onboarding',
				enqueuedAt: '2026-01-01T00:00:00.000Z',
			},
		];

		renderStage();

		expect( screen.getByTestId( 'editor' ) ).toHaveAttribute( 'data-upload-status', 'failed' );
	} );
} );
