import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { createTestQueryClient, createTestWrapper } from '../../../test-utils/query-client-wrapper';
import {
	makeRenamedTextFile,
	makeVideoFile,
	settleFileCheck,
} from '../../../test-utils/video-file';
import UploadOnboarding from '../index';
import type { LibraryItem } from '../../../types/library';
import type { QueryClient } from '@tanstack/react-query';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockNavigate = jest.fn();
const mockExitToLibrary = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
} ) );

// The Library renders the flow inside its own QueryClientWrapper; a per-test
// client here keeps cache state from leaking between tests.
let mockTestClient: QueryClient;

let mockConnected = true;
jest.mock( '../../../utils/connection', () => ( {
	isWpcomConnected: () => mockConnected,
} ) );

const defaultFreeTier = { isAtLimit: false, isFree: false, isUnlimited: true, videoCount: 0 };
let mockFreeTier = defaultFreeTier;
jest.mock( '../../../hooks/use-free-tier', () => ( {
	useFreeTier: () => mockFreeTier,
} ) );

const mockMarkFirstPublish = jest.fn();
jest.mock( '../../../hooks/use-first-run-state', () => ( {
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
jest.mock( '../../../hooks/use-upload', () => ( {
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
jest.mock( '../../../hooks/use-video', () => ( {
	useVideo: ( id: number | string ) => ( {
		video: id ? mockVideo : undefined,
		isLoading: false,
	} ),
	useInvalidateVideo: () => jest.fn(),
} ) );

jest.mock( '../../../hooks/use-update-video-meta', () => ( {
	useUpdateVideoMeta: () => ( { mutate: jest.fn(), isPending: false } ),
} ) );
jest.mock( '../../../hooks/use-update-chapters', () => ( {
	useUpdateChapters: () => ( { syncChapters: jest.fn() } ),
} ) );
jest.mock( '../../../hooks/use-delete-video', () => ( {
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
jest.mock( '../../../hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => jest.fn(),
} ) );
jest.mock( '../../../../client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => <div data-testid="caption-manager-modal" />,
} ) );
jest.mock( '../../../../client/components/caption-manager-modal/use-video-tracks', () => ( {
	getVideoInfoQueryKeyPrefix: ( guid: string ) => [ 'video-info', guid ],
} ) );

// The edit surface itself is covered by editor.test.tsx; here only the
// routing and the session the stage feeds it matter, so the mock surfaces
// the uploadSession as inspectable attributes.
jest.mock( '../../video-details/editor', () => ( {
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

// How a scripted media-library request ends. `error` is the transport failure
// the XHR reports through `onerror` (no status, no body); `load` is a real
// response, 2xx or not.
type MockXhrOutcome = { kind: 'error' } | { kind: 'load'; status: number; responseText?: string };

/*
 * The disconnected path uploads through a raw XMLHttpRequest to wp/v2/media
 * rather than through apiFetch or the tus queue, so there is nothing already
 * mocked in this file for it to go through. This stand-in records each request
 * and hands it back to the test, which decides when and how it ends — the
 * interstitial only exists while a request is in flight, so a stub that
 * completed itself inside `send()` would skip straight past it.
 */
class MockXhr {
	public method = '';
	public url = '';
	public headers: Record< string, string > = {};
	public status = 0;
	public responseText = '';
	public upload: {
		onprogress?: ( event: { lengthComputable: boolean; loaded: number; total: number } ) => void;
	} = {};
	public onload: ( () => void ) | null = null;
	public onerror: ( () => void ) | null = null;

	public open( method: string, url: string ) {
		this.method = method;
		this.url = url;
	}

	public setRequestHeader( name: string, value: string ) {
		this.headers[ name ] = value;
	}

	public send() {
		mockXhrRequests.push( this );
		// Half-way, so the interstitial has a real percentage to render.
		this.upload.onprogress?.( { lengthComputable: true, loaded: 5, total: 10 } );
	}

	public finish( outcome: MockXhrOutcome ) {
		if ( outcome.kind === 'error' ) {
			this.onerror?.();
			return;
		}
		this.status = outcome.status;
		this.responseText = outcome.responseText ?? '';
		this.onload?.();
	}
}

let mockXhrRequests: MockXhr[] = [];

/**
 * End the media-library request the flow has in flight.
 *
 * @param outcome - How the request should end.
 */
async function endUpload( outcome: MockXhrOutcome ) {
	const request = mockXhrRequests[ mockXhrRequests.length - 1 ];
	if ( ! request ) {
		throw new Error( 'no media-library request was started' );
	}
	await act( async () => {
		request.finish( outcome );
	} );
}

/**
 * Render the stage inside the per-test query client.
 *
 * @return The render result.
 */
function renderStage() {
	return render( <UploadOnboarding onExitToLibrary={ mockExitToLibrary } />, {
		wrapper: createTestWrapper( mockTestClient ),
	} );
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

	it( 'starts every file in the shared queue and hands a connected multi-drop to the listing', async () => {
		const { container } = renderStage();

		await dropFiles( container, [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ) ] );

		expect( mockStartUpload ).toHaveBeenCalledTimes( 2 );
		expect( mockExitToLibrary ).toHaveBeenCalled();
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

	/*
	 * The unconnected install — local Docker, or any site without a
	 * WordPress.com connection. There is no upload JWT here, so the tus queue
	 * is bypassed entirely and the flow runs its own wp/v2/media XHR through
	 * the uploading → details → success interstitials. This is the first path a
	 * developer checking the branch out hits, and the only one the connected
	 * tests above never touch.
	 */
	describe( 'disconnected site', () => {
		let realXhr: typeof XMLHttpRequest;

		beforeEach( () => {
			mockConnected = false;
			mockXhrRequests = [];
			realXhr = window.XMLHttpRequest;
			window.XMLHttpRequest = MockXhr as unknown as typeof XMLHttpRequest;
			// `restApiConfig()` prefers JPVIDEOPRESS_INITIAL_STATE, which the boot
			// payload supplies in the browser and nothing defines under jest; the
			// wpApiSettings fallback is the other half of that read.
			( window as typeof window & { wpApiSettings?: unknown } ).wpApiSettings = {
				root: 'https://example.com/wp-json/',
				nonce: 'test-nonce',
			};
		} );

		afterEach( () => {
			window.XMLHttpRequest = realXhr;
			delete ( window as typeof window & { wpApiSettings?: unknown } ).wpApiSettings;
		} );

		it( 'carries a drop through the media library to the published state', async () => {
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

			// The tus queue is not involved at all on this path.
			expect( mockStartUpload ).not.toHaveBeenCalled();

			// Step 1 — the interstitial, with the request genuinely in flight.
			const request = mockXhrRequests[ 0 ];
			expect( request.method ).toBe( 'POST' );
			expect( request.url ).toBe( 'https://example.com/wp-json/wp/v2/media' );
			expect( request.headers[ 'X-WP-Nonce' ] ).toBe( 'test-nonce' );
			expect( screen.getByText( 'Uploading your video' ) ).toBeInTheDocument();
			expect( screen.getByText( '50%' ) ).toBeInTheDocument();

			await endUpload( {
				kind: 'load',
				status: 201,
				responseText: JSON.stringify( {
					id: 77,
					source_url: 'https://example.com/one.mp4',
					jetpack_videopress: { guid: 'g77' },
				} ),
			} );

			// Step 2 — details. The advance is on a 450ms settle timer, so this is
			// a findBy rather than a fixed number of ticks.
			await expect( screen.findByText( 'Add your video details' ) ).resolves.toBeInTheDocument();
			expect( screen.getByText( 'Uploaded' ) ).toBeInTheDocument();

			await userEvent.click( screen.getByRole( 'button', { name: 'Publish video' } ) );

			// Step 3 — success. The title falls back to the file name, and the share
			// link is the attachment URL the media response carried.
			await expect( screen.findByText( 'Your video is published' ) ).resolves.toBeInTheDocument();
			// Scoped to the success card: the outgoing details card, which names the
			// same file, is still mounted through the transition.
			expect(
				screen.getByText( 'one.mp4', { selector: '.vp-success__title' } )
			).toBeInTheDocument();
			expect( screen.getByLabelText( 'Share link' ) ).toHaveValue( 'https://example.com/one.mp4' );
			expect( mockMarkFirstPublish ).toHaveBeenCalled();
			// Nothing on this path navigates away on its own — the user leaves via
			// "Go to Home".
			expect( mockNavigate ).not.toHaveBeenCalled();
			await userEvent.click( screen.getByRole( 'button', { name: 'Go to Home' } ) );
			expect( mockNavigate ).toHaveBeenCalledWith( { href: '/home' } );
		} );

		it( 'says the connection dropped when the request never lands', async () => {
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ) ] );
			await endUpload( { kind: 'error' } );

			// The failure is stated on the card the user is already looking at,
			// with a way back — not left as a bar stuck at 50%.
			expect( screen.getByText( 'Upload failed' ) ).toBeInTheDocument();
			expect(
				screen.getByText( 'Upload failed. Please check your connection and try again.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Back' } ) ).toBeInTheDocument();
		} );

		it( 'surfaces the server’s own message from a refused media response', async () => {
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ) ] );
			await endUpload( {
				kind: 'load',
				status: 413,
				responseText: JSON.stringify( { message: 'The file is too large for this server.' } ),
			} );

			expect( screen.getByText( 'Upload failed' ) ).toBeInTheDocument();
			expect( screen.getByText( 'The file is too large for this server.' ) ).toBeInTheDocument();
		} );

		it( 'falls back to the HTTP status when a refused response has no message', async () => {
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ) ] );
			await endUpload( { kind: 'load', status: 500, responseText: 'not json at all' } );

			expect( screen.getByText( 'Upload failed with HTTP status 500.' ) ).toBeInTheDocument();
		} );

		it( 'refuses to start when the REST credentials are missing', async () => {
			// The nonce is what signs the wp/v2/media POST. Without it the upload
			// cannot be attempted, and the flow has to say so rather than open a
			// request that will be rejected.
			delete ( window as typeof window & { wpApiSettings?: unknown } ).wpApiSettings;
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ) ] );

			expect( mockXhrRequests ).toHaveLength( 0 );
			expect(
				screen.getByText(
					'Video upload is unavailable because the REST API credentials are missing.'
				)
			).toBeInTheDocument();
		} );

		it( 'reports each file of a multi-drop on the one interstitial', async () => {
			// Disconnected multi-drops keep the interstitial instead of handing off
			// to the Library, which only lists WordPress.com VideoPress rows and so
			// would show nothing at all here.
			const { container } = renderStage();

			await dropFiles( container, [ makeFile( 'one.mp4' ), makeFile( 'two.mp4' ) ] );

			expect( mockNavigate ).not.toHaveBeenCalled();
			expect( screen.getByText( 'Uploading 2 videos' ) ).toBeInTheDocument();
			expect( mockXhrRequests ).toHaveLength( 2 );

			// One fails, one succeeds: the flow must not advance on the survivor.
			await act( async () => {
				mockXhrRequests[ 0 ].finish( {
					kind: 'load',
					status: 201,
					responseText: JSON.stringify( { id: 77 } ),
				} );
				mockXhrRequests[ 1 ].finish( { kind: 'error' } );
			} );

			expect( screen.getByText( '1 upload failed. Go back and try again.' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Add details · 2 videos' ) ).not.toBeInTheDocument();
		} );
	} );
} );
