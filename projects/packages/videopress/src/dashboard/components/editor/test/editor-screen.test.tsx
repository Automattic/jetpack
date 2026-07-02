import { act, render, screen, waitFor } from '@testing-library/react';
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
// reduce it to the two slots the tests interact with (actions + body).
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { actions, children }: { actions?: ReactNode; children?: ReactNode } ) => (
		<div>
			<div>{ actions }</div>
			{ children }
		</div>
	),
} ) );
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
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
		expect( isButtonDisabled( 'Discard' ) ).toBe( true );
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

		expect(
			screen.getByText(
				'Viewers will see the edited video. Your original is kept and can be restored.'
			)
		).toBeInTheDocument();
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
} );
