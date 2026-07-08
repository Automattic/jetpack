import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import { EDITS_QUERY_KEY } from '../../../hooks/use-video-edits';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../../test-utils/query-client-wrapper';
import StudioEditorScreen from '../editor-screen';
import type { VideoEdits } from '../../../types/edits';
import type { ReactNode } from 'react';

// Declared here (and not only inside test-utils/mock-api-fetch) because this
// file imports use-video-edits BEFORE the test-utils helper: jest.mock calls
// in this file are hoisted above all imports, so the hook modules resolve the
// mocked module instead of capturing the real one first.
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// VideoLayout's AdminPage/Breadcrumbs chrome needs the full admin shell;
// reduce it to the slots the tests interact with (breadcrumbs, actions, body).
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( {
		breadcrumbs,
		actions,
		children,
	}: {
		breadcrumbs?: ReactNode;
		actions?: ReactNode;
		children?: ReactNode;
	} ) => (
		<div>
			<div>{ breadcrumbs }</div>
			<div>{ actions }</div>
			{ children }
		</div>
	),
} ) );
// The parent breadcrumb is a real router link in production; rendering it as
// a plain anchor lets the in-app link navigation guard be exercised.
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => <a href="/library">VideoPress</a>,
} ) );

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting rules.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

// jsdom reports zero layout everywhere; hand the timeline a fixed viewport.
jest.mock( '../timeline/use-element-width', () => ( {
	useElementWidth: () => ( { ref: () => {}, width: 1000 } ),
} ) );

// The filmstrip resolves via the storyboard endpoint plus <video> frame
// extraction, neither of which works in jsdom; keep the track on its neutral
// placeholder here. The hook has its own dedicated tests.
jest.mock( '../../../hooks/use-filmstrip', () => ( {
	useFilmstrip: () => ( { status: 'unavailable' } ),
} ) );

const mockUseNavigate = useNavigate as jest.Mock;

// jsdom (27) ships PointerEvent but not the pointer-capture element APIs the
// timeline drag hook calls; stub them so pointerdown handlers run.
beforeAll( () => {
	Object.assign( Element.prototype, {
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
		hasPointerCapture: () => false,
	} );
} );

const GUID = 'abc123';
const EDITS_PATH = `/wpcom/v2/videopress/${ GUID }/edits`;

/**
 * Build a raw /wp/v2/media item for useVideo.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A raw media item.
 */
function makeRawMedia( overrides: Record< string, unknown > = {} ) {
	return {
		id: 42,
		title: { rendered: 'My Clip' },
		source_url: 'https://example.com/clip.mp4',
		date: '2026-01-01T00:00:00',
		media_details: {
			videopress: { poster: 'https://example.com/poster.jpg', duration: 60000, finished: true },
		},
		jetpack_videopress: { guid: GUID, privacy_setting: 0, is_private: false },
		...overrides,
	};
}

/**
 * Build a GET …/edits response body.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete VideoEdits object.
 */
function makeEdits( overrides: Partial< VideoEdits > = {} ): VideoEdits {
	return {
		guid: GUID,
		revision: 0,
		original_duration_ms: 60000,
		output_duration_ms: 60000,
		operations: [],
		can_restore_original: false,
		job: { id: null, status: 'idle', target_revision: null, progress: null, error: null },
		updated: '2026-07-02T00:00:00+00:00',
		...overrides,
	};
}

type ApiState = {
	media: unknown;
	edits: VideoEdits;
	posts: { path?: string; method?: string; data?: unknown }[];
	onPost?: ( options: { data?: unknown } ) => unknown;
};

/**
 * Install an apiFetch handler backed by mutable API state, so tests can
 * evolve the server's edits response between refetches.
 *
 * @param api - The mutable API state.
 */
function installApi( api: ApiState ) {
	mockApiFetch( options => {
		const { path = '', method = 'GET' } = options;
		if ( path.startsWith( '/wp/v2/media/' ) ) {
			return api.media;
		}
		if ( path === EDITS_PATH ) {
			if ( method === 'POST' ) {
				api.posts.push( options );
				return api.onPost ? api.onPost( options ) : {};
			}
			return api.edits;
		}
		return {};
	} );
}

/**
 * Render the screen and wait until the video and the edits baseline loaded.
 *
 * @param client - The test QueryClient.
 * @return The render result.
 */
async function renderReadyEditor( client = createTestQueryClient() ) {
	const view = render( <StudioEditorScreen videoId="42" />, {
		wrapper: createTestWrapper( client ),
	} );
	await expect( screen.findByTestId( 'studio-editor-preview-video' ) ).resolves.toBeInTheDocument();
	// The waitFor's act wrapper also flushes the baseline LOAD effect the
	// data render triggers.
	await waitFor( () => expect( client.getQueryData( [ EDITS_QUERY_KEY, GUID ] ) ).toBeDefined() );
	return view;
}

/**
 * Add a cut at the playhead (0ms) — the fastest way to make the session dirty.
 *
 * @param user - The userEvent instance.
 */
async function addCut( user: ReturnType< typeof userEvent.setup > ) {
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
}

/**
 * Read the disabled state of a header button. Both `@wordpress/ui` and
 * `@wordpress/components` buttons express disabled through `aria-disabled`
 * here (no native attribute), so jest-dom's toBeDisabled can't be used.
 *
 * @param name - The button's accessible name.
 * @return Whether the button is disabled.
 */
function isButtonDisabled( name: string ): boolean {
	return screen.getByRole( 'button', { name } ).getAttribute( 'aria-disabled' ) === 'true';
}

describe( 'StudioEditorScreen', () => {
	let navigate: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();
		navigate = jest.fn();
		mockUseNavigate.mockReturnValue( navigate );
		// jsdom's media element implements neither play() nor pause(); stub
		// them so the preview hook's state machine can run.
		jest.spyOn( window.HTMLMediaElement.prototype, 'play' ).mockImplementation( function (
			this: HTMLMediaElement
		) {
			this.dispatchEvent( new Event( 'play' ) );
			return Promise.resolve();
		} );
		jest.spyOn( window.HTMLMediaElement.prototype, 'pause' ).mockImplementation( function (
			this: HTMLMediaElement
		) {
			this.dispatchEvent( new Event( 'pause' ) );
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'shows a loading placeholder while the video is fetched', () => {
		mockApiFetch( () => new Promise( () => {} ) );

		render( <StudioEditorScreen videoId="42" />, { wrapper: createTestWrapper() } );

		expect( screen.getByTestId( 'studio-editor-loading' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'studio-timeline' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the processing state instead of the editor while the video transcodes', async () => {
		const api: ApiState = {
			media: makeRawMedia( {
				media_details: { videopress: { duration: 60000, finished: false } },
			} ),
			edits: makeEdits(),
			posts: [],
		};
		installApi( api );

		render( <StudioEditorScreen videoId="42" />, { wrapper: createTestWrapper() } );

		await expect(
			screen.findByText( 'This video is still processing. The editor will open once it finishes.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'studio-timeline' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the not-found state for a missing video', async () => {
		mockApiFetch( () => {
			throw { code: 'rest_post_invalid_id' };
		} );

		render( <StudioEditorScreen videoId="42" />, { wrapper: createTestWrapper() } );

		await expect(
			screen.findByText( "We couldn't find that video." )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders the editor with Save disabled while the session is clean', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );

		await renderReadyEditor();

		expect( screen.getByTestId( 'studio-timeline' ) ).toBeInTheDocument();
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		expect( isButtonDisabled( 'Discard changes' ) ).toBe( true );
		expect( isButtonDisabled( 'Undo' ) ).toBe( true );
	} );

	it( 'wires Undo/Redo in the header to the session history', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyEditor();
		await addCut( user );

		expect( isButtonDisabled( 'Save' ) ).toBe( false );
		expect( isButtonDisabled( 'Undo' ) ).toBe( false );
		expect( isButtonDisabled( 'Redo' ) ).toBe( true );

		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		expect( isButtonDisabled( 'Redo' ) ).toBe( false );

		await user.click( screen.getByRole( 'button', { name: 'Redo' } ) );
		expect( isButtonDisabled( 'Save' ) ).toBe( false );
	} );

	it( 'coalesces a whole cut-body drag into a single undo entry', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyEditor();
		// One undo entry: the cut lands at [0, 2000] on the 60s master
		// (viewport 1000px → pxPerMs 1/60, so clientX × 60 = ms).
		await addCut( user );
		const cut = screen.getByTestId( /^studio-timeline-cut-cut-\d+$/ );
		expect( cut ).toHaveStyle( { left: '0px' } );

		// Drag the body across two moves; TRANSIENT + COMMIT must fold the
		// whole gesture into exactly one more undo entry.
		// eslint-disable-next-line testing-library/prefer-user-event -- drag gestures need raw pointer events carrying clientX/pointerId.
		fireEvent.pointerDown( cut, { button: 0, pointerId: 1, clientX: 10 } );
		// eslint-disable-next-line testing-library/prefer-user-event -- drag gestures need raw pointer events carrying clientX/pointerId.
		fireEvent.pointerMove( cut, { pointerId: 1, clientX: 60 } );
		// eslint-disable-next-line testing-library/prefer-user-event -- drag gestures need raw pointer events carrying clientX/pointerId.
		fireEvent.pointerMove( cut, { pointerId: 1, clientX: 110 } );
		// eslint-disable-next-line testing-library/prefer-user-event -- drag gestures need raw pointer events carrying clientX/pointerId.
		fireEvent.pointerUp( cut, { pointerId: 1 } );
		// clientX 110 → pointer 6600ms, minus the 600ms grab offset → [6000, 8000].
		expect( cut ).toHaveStyle( { left: '100px' } );

		// First undo: back to the pre-drag position — NOT some mid-drag state.
		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( cut ).toHaveStyle( { left: '0px' } );

		// Second undo: the cut itself goes; the drag really was one entry.
		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( screen.queryAllByTestId( /^studio-timeline-cut-cut-\d+$/ ) ).toHaveLength( 0 );
	} );

	it( 'saves through the confirm dialog and re-baselines when the job completes', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		api.onPost = () => {
			api.edits = makeEdits( {
				job: {
					id: 'mock-job-1-1',
					status: 'processing',
					target_revision: 1,
					progress: 0.5,
					error: null,
				},
			} );
			return { guid: GUID, revision: 0, job: api.edits.job };
		};
		installApi( api );
		const client = createTestQueryClient();
		const user = userEvent.setup();

		await renderReadyEditor( client );
		await addCut( user );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		const confirmMessage = screen.getByText(
			'Viewers will see the edited video. Your original is kept and can be restored.'
		);
		expect( confirmMessage ).toBeInTheDocument();
		// Dialog.Popup is an unpadded flex column; body padding comes from the
		// Dialog.Content region, marked by the overlay scroll-container
		// attribute. Guards against the message sitting flush against the
		// popup edges.
		expect(
			// eslint-disable-next-line testing-library/no-node-access -- asserting an ancestor region requires DOM traversal.
			confirmMessage.closest( '[data-wp-ui-overlay-scroll-container]' )
		).not.toBeNull();
		await user.click( screen.getByRole( 'button', { name: 'Save edits' } ) );

		await waitFor( () => expect( api.posts ).toHaveLength( 1 ) );
		expect( api.posts[ 0 ].data ).toEqual( {
			base_revision: 0,
			operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
		} );

		// The refetch picks up the processing job: banner + locked timeline.
		await expect( screen.findByText( 'Applying edits…' ) ).resolves.toBeInTheDocument();
		expect( screen.getByTestId( 'studio-editor-timeline-lock' ) ).toHaveAttribute(
			'aria-busy',
			'true'
		);
		expect( isButtonDisabled( 'Save' ) ).toBe( true );

		// The lock scopes to the strip's scroller: the toolbar transport stays
		// clickable while the job runs…
		expect( screen.getByTestId( 'studio-timeline-scroller' ) ).toHaveClass(
			'vp-studio-timeline__scroller--locked'
		);
		( window.HTMLMediaElement.prototype.play as jest.Mock ).mockClear();
		await user.click( screen.getByTestId( 'studio-timeline-transport-play' ) );
		expect( window.HTMLMediaElement.prototype.play ).toHaveBeenCalled();
		// …while edit dispatches are still dropped by the guarded dispatch.
		expect( screen.getAllByTestId( /^studio-timeline-cut-cut-\d+$/ ) ).toHaveLength( 1 );
		await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
		expect( screen.getAllByTestId( /^studio-timeline-cut-cut-\d+$/ ) ).toHaveLength( 1 );

		// The job completes server-side; the next refetch re-baselines.
		api.edits = makeEdits( {
			revision: 1,
			operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
			output_duration_ms: 58000,
			can_restore_original: true,
			job: {
				id: 'mock-job-1-1',
				status: 'complete',
				target_revision: 1,
				progress: null,
				error: null,
			},
		} );
		await act( async () => {
			await client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, GUID ] } );
		} );

		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Video edits saved.' ) );
		expect( screen.queryByText( 'Applying edits…' ) ).not.toBeInTheDocument();
		// Re-baselined: the saved cut is no longer "dirty".
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
	} );

	it( 'surfaces a 409 as the conflict banner and re-baselines via "Reload latest"', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		api.onPost = () => {
			throw { code: 'edits_conflict', message: 'conflict', data: { current_revision: 2 } };
		};
		installApi( api );
		const client = createTestQueryClient();
		const user = userEvent.setup();

		await renderReadyEditor( client );
		await addCut( user );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save edits' } ) );

		await expect(
			screen.findByText( 'This video was edited somewhere else since you opened the editor.' )
		).resolves.toBeInTheDocument();
		expect( isButtonDisabled( 'Save' ) ).toBe( true );

		// The server's newer state loads on request.
		api.edits = makeEdits( {
			revision: 2,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 59000 } ],
			output_duration_ms: 58000,
			can_restore_original: true,
		} );
		await user.click( screen.getByRole( 'button', { name: 'Reload latest' } ) );

		await waitFor( () =>
			expect(
				screen.queryByText( 'This video was edited somewhere else since you opened the editor.' )
			).not.toBeInTheDocument()
		);
		// Local edits were replaced by the server baseline: clean again.
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
	} );

	it( 'blocks tab close via beforeunload only while dirty', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyEditor();

		const cleanEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( cleanEvent );
		expect( cleanEvent.defaultPrevented ).toBe( false );

		await addCut( user );

		const dirtyEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( dirtyEvent );
		expect( dirtyEvent.defaultPrevented ).toBe( true );
	} );

	it( 'confirms sub-nav navigation while dirty and navigates on approval', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );

		await renderReadyEditor();
		await addCut( user );

		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( confirmSpy ).toHaveBeenCalled();
		expect( navigate ).not.toHaveBeenCalled();

		confirmSpy.mockReturnValue( true );
		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42' } );
	} );

	it( 'navigates without prompting while the session is clean', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' );

		await renderReadyEditor();
		await user.click( screen.getByRole( 'tab', { name: 'Analytics' } ) );

		expect( confirmSpy ).not.toHaveBeenCalled();
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/analytics' } );
	} );

	it( 'guards in-app link clicks (the breadcrumb) while dirty', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
		// Record whether the capture-phase guard preventDefaulted each link
		// click (and stop jsdom from attempting a real navigation).
		const linkClicks: boolean[] = [];
		const recorder = ( event: MouseEvent ) => {
			// eslint-disable-next-line testing-library/no-node-access -- native listener inspecting the raw event target; no query applies.
			if ( ( event.target as Element ).closest( 'a' ) ) {
				linkClicks.push( event.defaultPrevented );
				event.preventDefault();
			}
		};
		document.addEventListener( 'click', recorder );

		try {
			await renderReadyEditor();
			const link = screen.getByRole( 'link', { name: 'VideoPress' } );

			// Clean session: no prompt, navigation proceeds.
			await user.click( link );
			expect( confirmSpy ).not.toHaveBeenCalled();
			expect( linkClicks ).toEqual( [ false ] );

			await addCut( user );

			// Dirty + declined: prompted, navigation blocked.
			await user.click( link );
			expect( confirmSpy ).toHaveBeenCalledTimes( 1 );
			expect( linkClicks ).toEqual( [ false, true ] );

			// Dirty + confirmed: navigation proceeds.
			confirmSpy.mockReturnValue( true );
			await user.click( link );
			expect( linkClicks ).toEqual( [ false, true, false ] );
		} finally {
			document.removeEventListener( 'click', recorder );
		}
	} );

	it( 'guards browser back/forward while dirty', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );

		await renderReadyEditor();

		// Clean session: the guard is not even attached.
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( confirmSpy ).not.toHaveBeenCalled();

		await addCut( user );

		// Dirty + declined: re-navigate to the editor to cancel the traversal.
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( confirmSpy ).toHaveBeenCalledTimes( 1 );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );

		// Dirty + confirmed: let the router's own navigation stand.
		confirmSpy.mockReturnValue( true );
		navigate.mockClear();
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( navigate ).not.toHaveBeenCalled();
	} );

	it( 'keeps the editor locked from save acceptance until the job is visible', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		// The POST is accepted, but api.edits stays idle: the refetch lands
		// before the job is visible (the gap the pending-job lock must cover).
		api.onPost = () => ( {
			guid: GUID,
			revision: 0,
			job: {
				id: 'mock-job-1-1',
				status: 'processing',
				target_revision: 1,
				progress: 0,
				error: null,
			},
		} );
		installApi( api );
		const client = createTestQueryClient();
		const user = userEvent.setup();

		await renderReadyEditor( client );
		await addCut( user );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save edits' } ) );
		await waitFor( () => expect( api.posts ).toHaveLength( 1 ) );

		// Locked even though the server still reports an idle job — edits made
		// now would be silently replaced when the job's revision lands.
		await waitFor( () =>
			expect( screen.getByTestId( 'studio-editor-timeline-lock' ) ).toHaveAttribute(
				'aria-busy',
				'true'
			)
		);
		expect( isButtonDisabled( 'Save' ) ).toBe( true );

		// The job's revision lands: re-baseline, notify, unlock.
		api.edits = makeEdits( {
			revision: 1,
			operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
			output_duration_ms: 58000,
			can_restore_original: true,
			job: {
				id: 'mock-job-1-1',
				status: 'complete',
				target_revision: 1,
				progress: null,
				error: null,
			},
		} );
		await act( async () => {
			await client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, GUID ] } );
		} );

		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Video edits saved.' ) );
		expect( screen.getByTestId( 'studio-editor-timeline-lock' ) ).not.toHaveAttribute(
			'aria-busy'
		);
	} );

	it( 'raises the conflict banner for a foreign revision landing after our job failed', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		api.onPost = () => {
			// The accepted job fails server-side; the next GET reports it.
			api.edits = makeEdits( {
				job: {
					id: 'mock-job-1-1',
					status: 'failed',
					target_revision: 1,
					progress: null,
					error: { code: 'transcode_failed', message: 'The edited video could not be transcoded.' },
				},
			} );
			return {
				guid: GUID,
				revision: 0,
				job: {
					id: 'mock-job-1-1',
					status: 'processing',
					target_revision: 1,
					progress: 0,
					error: null,
				},
			};
		};
		installApi( api );
		const client = createTestQueryClient();
		const user = userEvent.setup();

		await renderReadyEditor( client );
		await addCut( user );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save edits' } ) );

		await expect(
			screen.findByText( 'The edited video could not be transcoded.' )
		).resolves.toBeInTheDocument();

		// A foreign save lands on the exact revision our FAILED job targeted
		// (revisions are sequential; the failed job never consumed its slot).
		// It must NOT be mistaken for our own job completing.
		api.edits = makeEdits( {
			revision: 1,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 59000 } ],
			output_duration_ms: 58000,
			can_restore_original: true,
		} );
		await act( async () => {
			await client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, GUID ] } );
		} );

		await expect(
			screen.findByText( 'This video was edited somewhere else since you opened the editor.' )
		).resolves.toBeInTheDocument();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'detaches the timeline shortcuts while the confirm dialog is open', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyEditor();
		// addCut leaves the new cut selected — exactly what a stray Delete
		// behind the dialog would remove.
		await addCut( user );
		const cutCount = () => screen.getAllByTestId( /^studio-timeline-cut-cut-\d+$/ ).length;
		expect( cutCount() ).toBe( 1 );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect(
			screen.getByText(
				'Viewers will see the edited video. Your original is kept and can be restored.'
			)
		).toBeInTheDocument();

		// Delete must not mutate the session the user is about to confirm.
		// eslint-disable-next-line testing-library/prefer-user-event -- the shortcut under test listens for raw keydowns on document.
		fireEvent.keyDown( document.body, { key: 'Delete' } );
		expect( cutCount() ).toBe( 1 );

		// With the dialog closed the shortcut works again.
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event -- the shortcut under test listens for raw keydowns on document.
		fireEvent.keyDown( document.body, { key: 'Delete' } );
		expect( screen.queryAllByTestId( /^studio-timeline-cut-cut-\d+$/ ) ).toHaveLength( 0 );
	} );

	it( 'surfaces a failed initial edits load and recovers via retry', async () => {
		const api: ApiState = { media: makeRawMedia(), edits: makeEdits(), posts: [] };
		let editsFails = true;
		mockApiFetch( options => {
			const { path = '' } = options;
			if ( path.startsWith( '/wp/v2/media/' ) ) {
				return api.media;
			}
			if ( path === EDITS_PATH ) {
				if ( editsFails ) {
					throw { code: 'edits_video_not_found' };
				}
				return api.edits;
			}
			return {};
		} );
		const user = userEvent.setup();

		render( <StudioEditorScreen videoId="42" />, { wrapper: createTestWrapper() } );

		await expect(
			screen.findByText( "The editor couldn't load this video's edit state." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'studio-timeline' ) ).not.toBeInTheDocument();

		editsFails = false;
		await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		await expect( screen.findByTestId( 'studio-timeline' ) ).resolves.toBeInTheDocument();
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
	} );
} );
