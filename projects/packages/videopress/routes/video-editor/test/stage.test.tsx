import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import {
	parseDescription,
	serializeDescription,
} from '../../../src/client/utils/video-chapters/description';
import { resetFeatures, setFeatures } from '../../../src/dashboard/test-utils/features';
import { getApiFetchMock, mockApiFetch } from '../../../src/dashboard/test-utils/mock-api-fetch';
import {
	createTestQueryClient,
	createTestWrapper,
} from '../../../src/dashboard/test-utils/query-client-wrapper';
import { stage as Stage } from '../stage';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Declared here (and not only inside test-utils/mock-api-fetch) because this
// file imports hook modules BEFORE the test-utils helper: jest.mock calls
// in this file are hoisted above all imports, so the hook modules resolve the
// mocked module instead of capturing the real one first.
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
	useParams: () => ( { id: '42' } ),
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
	Breadcrumbs: () => <a href="/">VideoPress</a>,
} ) );

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting rules.
const mockSuccessNotice = jest.fn();
const mockWarningNotice = jest.fn();
const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createWarningNotice: mockWarningNotice,
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

// The stage's own QueryClientWrapper carries the window-singleton client and
// the connection gate; swap in a per-test client so cache state can't leak
// between tests and the gate's fetches stay out of the way.
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

// jsdom reports zero layout everywhere; hand the timeline a fixed viewport.
jest.mock( '../../../src/client/components/chapters-editor/timeline/use-element-width', () => ( {
	useElementWidth: () => ( { ref: () => {}, width: 1000 } ),
} ) );

// The manual-VTT probe hits the public video API; stub it (default:
// 'editable', set in beforeEach) and let tests flip it to 'manual'.
const mockProbeManualTrack = jest.fn();
jest.mock( '../../../src/client/utils/video-chapters/probe-manual-track', () => ( {
	probeManualTrack: ( ...args: unknown[] ) => mockProbeManualTrack( ...args ),
} ) );

// The stage fetches the v1.1 item once, feeding both the probe and the
// Simple-site playback fallback; stub the fetch so no request escapes jsdom.
const mockFetchVideoItem = jest.fn();
jest.mock( '../../../src/client/lib/fetch-video-item', () => ( {
	fetchVideoItem: ( ...args: unknown[] ) => mockFetchVideoItem( ...args ),
} ) );

// The chapters VTT sync drives the tracks endpoints through its own
// pipeline (covered by the shared sync core's tests); here only the calls
// matter. It never rejects by contract.
const mockSyncChapters = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-update-chapters', () => ( {
	useUpdateChapters: () => ( { syncChapters: mockSyncChapters } ),
} ) );

const mockUseNavigate = useNavigate as jest.Mock;

// jsdom ships PointerEvent but not the pointer-capture element APIs the
// timeline drag hook calls; stub them so pointerdown handlers run.
beforeAll( () => {
	Object.assign( Element.prototype, {
		setPointerCapture: () => {},
		releasePointerCapture: () => {},
		hasPointerCapture: () => false,
	} );
} );

const GUID = 'abc123';
const META_PATH = '/wpcom/v2/videopress/meta';

/*
 * The default fixture's chapters are VALID by the publish rules the VTT sync
 * enforces (three titled chapters, first at 0:00, ≥10s apart), so the save
 * tests exercise the success branch; the invalid branch gets its own fixture.
 */
const VALID_DESCRIPTION = '00:00 Intro\n00:30 Middle\n00:50 End';
// Two chapters: below the three the player's chapter track requires.
const INVALID_DESCRIPTION = '00:00 Intro\n00:30 Middle';

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
		jetpack_videopress: {
			guid: GUID,
			privacy_setting: 0,
			is_private: false,
			description: VALID_DESCRIPTION,
		},
		...overrides,
	};
}

/**
 * Build a raw media item whose chapters description is the given one.
 *
 * @param description - The video description to seed the chapters from.
 * @return A raw media item.
 */
function makeRawMediaWithDescription( description: string ) {
	return makeRawMedia( {
		jetpack_videopress: {
			guid: GUID,
			privacy_setting: 0,
			is_private: false,
			description,
		},
	} );
}

type ApiState = {
	media: unknown;
	/** Captured POSTs to the meta endpoint (chapters saves). */
	metaPosts: { path?: string; method?: string; data?: unknown }[];
	onMetaPost?: ( options: { data?: unknown } ) => unknown;
};

/**
 * Install an apiFetch handler backed by mutable API state.
 *
 * @param api - The mutable API state.
 */
function installApi( api: ApiState ) {
	mockApiFetch( options => {
		const { path = '', method = 'GET' } = options;
		if ( path.startsWith( '/wp/v2/media/' ) ) {
			return api.media;
		}
		if ( path === META_PATH && method === 'POST' ) {
			api.metaPosts.push( options );
			if ( api.onMetaPost ) {
				return api.onMetaPost( options );
			}
			// Persist the description like the real endpoint would, so a later
			// media refetch sees the saved value instead of reverting the
			// chapters store.
			const patch = options.data as { description?: string } | undefined;
			const media = api.media as { jetpack_videopress?: Record< string, unknown > };
			if ( typeof patch?.description === 'string' && media?.jetpack_videopress ) {
				api.media = {
					...media,
					jetpack_videopress: { ...media.jetpack_videopress, description: patch.description },
				};
			}
			return {};
		}
		return {};
	} );
}

/**
 * Render the stage and wait until the video loaded and the manual-VTT probe
 * settled (the tool mounts locked-busy until then).
 *
 * @return The render result.
 */
async function renderReadyChapters() {
	const view = render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );
	await expect( screen.findByTestId( 'chapters-preview-video' ) ).resolves.toBeInTheDocument();
	// A 'manual' probe result clears aria-busy too (read-only, not locked),
	// so this cannot deadlock that path.
	await waitFor( () =>
		expect( screen.getByTestId( 'chapters-timeline-lock' ) ).not.toHaveAttribute( 'aria-busy' )
	);
	return view;
}

/**
 * Rename the first chapter to "Renamed" (drafts commit on blur) — the
 * fastest way to dirty the chapters session.
 *
 * @param user - The userEvent instance.
 */
async function renameFirstChapter( user: ReturnType< typeof userEvent.setup > ) {
	const title = () => screen.getByLabelText( 'Chapter 1 title' );
	await user.clear( title() );
	await user.type( title(), 'Renamed' );
	fireEvent.blur( title() );
}

/**
 * The description a save of the renamed chaptered media must write:
 * computed through the same parser/serializer pair the screen uses.
 *
 * @param source - The description the rename started from.
 * @return The expected description.
 */
function renamedDescription( source: string = VALID_DESCRIPTION ): string {
	const { rows } = parseDescription( source );
	return serializeDescription( source, [ { ...rows[ 0 ], title: 'Renamed' }, ...rows.slice( 1 ) ] );
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

describe( 'video-editor stage', () => {
	let navigate: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();
		mockTestClient = createTestQueryClient();
		navigate = jest.fn();
		mockUseNavigate.mockReturnValue( navigate );
		mockProbeManualTrack.mockResolvedValue( 'editable' );
		mockFetchVideoItem.mockResolvedValue( {} );
		mockSyncChapters.mockResolvedValue( 'uploaded' );
		// The whole screen is gated on the chapters editor; enable it for every
		// case but the gate's own, below.
		setFeatures( { chaptersEditor: true } );
	} );

	afterEach( () => {
		resetFeatures();
	} );

	// The route is stripped from the registry when the gate is off, so this
	// only runs for a stale bookmark surviving a build/PHP skew — it must
	// dead-end rather than mount a half-working editor.
	it( 'shows the not-found state when the chapters editor is off', () => {
		setFeatures( { chaptersEditor: false } );
		installApi( { media: makeRawMedia(), metaPosts: [] } );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );

		expect( screen.getByText( "We couldn't find that video." ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'chapters-preview-video' ) ).not.toBeInTheDocument();
		// Guarded ahead of the media fetch, so no request escapes either.
		expect( getApiFetchMock() ).not.toHaveBeenCalled();
	} );

	it( 'shows a loading placeholder while the video is fetched', () => {
		mockApiFetch( () => new Promise( () => {} ) );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );

		expect( screen.getByTestId( 'chapters-loading' ) ).toBeInTheDocument();
	} );

	it( 'shows the not-found state for a non-VideoPress video', async () => {
		installApi( { media: makeRawMedia( { jetpack_videopress: undefined } ), metaPosts: [] } );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );

		await expect(
			screen.findByText( "We couldn't find that video." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'chapters' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the processing state instead of the editor while the video transcodes', async () => {
		installApi( {
			media: makeRawMedia( {
				media_details: { videopress: { duration: 60000, finished: false } },
			} ),
			metaPosts: [],
		} );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );

		await expect(
			screen.findByText(
				'This video is still processing. Chapters will be available once it finishes.'
			)
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'chapters' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the processing state for a video without a known duration', async () => {
		installApi( {
			media: makeRawMedia( {
				media_details: {
					videopress: { poster: 'https://example.com/poster.jpg', duration: 0, finished: true },
				},
			} ),
			metaPosts: [],
		} );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );

		await expect(
			screen.findByText(
				'This video is still processing. Chapters will be available once it finishes.'
			)
		).resolves.toBeInTheDocument();
	} );

	it( 'renders the editor with Save disabled while the session is clean', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );

		await renderReadyChapters();

		expect( screen.getByTestId( 'chapters' ) ).toBeInTheDocument();
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		expect( isButtonDisabled( 'Discard changes' ) ).toBe( true );
		expect( isButtonDisabled( 'Undo' ) ).toBe( true );
	} );

	it( 'wires Undo/Redo in the header to the chapters history', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();

		await renderReadyChapters();
		const title = () => screen.getByLabelText( 'Chapter 1 title' );
		await renameFirstChapter( user );
		expect( isButtonDisabled( 'Undo' ) ).toBe( false );

		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( title() ).toHaveValue( 'Intro' );
		expect( isButtonDisabled( 'Redo' ) ).toBe( false );
		await user.click( screen.getByRole( 'button', { name: 'Redo' } ) );
		expect( title() ).toHaveValue( 'Renamed' );
	} );

	it( 'locks the tool while the manual-VTT probe is pending and drops edits', async () => {
		let resolveProbe!: ( result: 'manual' | 'editable' ) => void;
		mockProbeManualTrack.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveProbe = resolve;
				} )
		);
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );
		await expect( screen.findByTestId( 'chapters-preview-video' ) ).resolves.toBeInTheDocument();
		await waitFor( () => expect( mockProbeManualTrack ).toHaveBeenCalled() );

		// Locked-busy (not read-only) while the probe is unresolved.
		expect( screen.getByTestId( 'chapters-timeline-lock' ) ).toHaveAttribute( 'aria-busy', 'true' );
		expect( isButtonDisabled( 'Undo' ) ).toBe( true );

		// No edit can even be attempted inside the probe window: the edit
		// controls are inert, so Save stays disabled and the navigation guards
		// stay unarmed — a late 'manual' result must not inherit an armed Save
		// over its description.
		expect( screen.getByLabelText( 'Chapter 1 title' ) ).toBeDisabled();
		expect( isButtonDisabled( 'Remove chapter 1' ) ).toBe( true );
		expect( isButtonDisabled( 'Add chapter at playhead' ) ).toBe( true );
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		const pendingEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( pendingEvent );
		expect( pendingEvent.defaultPrevented ).toBe( false );

		// The probe lands 'editable': unlocked, and edits arm Save again.
		await act( async () => {
			resolveProbe( 'editable' );
		} );
		expect( screen.getByTestId( 'chapters-timeline-lock' ) ).not.toHaveAttribute( 'aria-busy' );
		await renameFirstChapter( user );
		expect( isButtonDisabled( 'Save' ) ).toBe( false );
	} );

	it( 'turns the tool read-only when the probe reports a manual VTT', async () => {
		mockProbeManualTrack.mockResolvedValue( 'manual' );
		installApi( { media: makeRawMedia(), metaPosts: [] } );

		await renderReadyChapters();

		await expect(
			screen.findByText(
				'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.'
			)
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'chapters-rows' ) ).not.toBeInTheDocument();
		expect( screen.queryAllByTestId( /^chapters-marker-/ ) ).toHaveLength( 0 );
		expect( mockProbeManualTrack ).toHaveBeenCalledTimes( 1 );
		expect( mockProbeManualTrack ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: GUID, isPrivate: false } ),
			{ item: expect.anything() }
		);
		// One fetch feeds both the probe and the playback fallback.
		expect( mockFetchVideoItem ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the session inert when the probe lands manual after edit attempts in the window', async () => {
		let resolveProbe!: ( result: 'manual' | 'editable' ) => void;
		mockProbeManualTrack.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveProbe = resolve;
				} )
		);
		const api: ApiState = { media: makeRawMedia(), metaPosts: [] };
		installApi( api );

		render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );
		await expect( screen.findByTestId( 'chapters-preview-video' ) ).resolves.toBeInTheDocument();
		await waitFor( () => expect( mockProbeManualTrack ).toHaveBeenCalled() );

		// The original race: an edit reaching for the session while the probe
		// is in flight, with 'manual' landing afterwards. The edit controls are
		// inert for the whole window, so there is no edit to drop.
		expect( screen.getByLabelText( 'Chapter 1 title' ) ).toBeDisabled();
		await act( async () => {
			resolveProbe( 'manual' );
		} );

		await expect(
			screen.findByText(
				'Chapters for this video are managed by an uploaded VTT file, so they can’t be edited here.'
			)
		).resolves.toBeInTheDocument();
		// The dropped edit must not arm Save, Discard, or the guards…
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		expect( isButtonDisabled( 'Discard changes' ) ).toBe( true );
		const unloadEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( unloadEvent );
		expect( unloadEvent.defaultPrevented ).toBe( false );
		// …and nothing may rewrite the manually-managed description.
		expect( api.metaPosts ).toHaveLength( 0 );
	} );

	it( 'saves chapters through the meta endpoint and the VTT sync', async () => {
		const api: ApiState = { media: makeRawMedia(), metaPosts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyChapters();
		await renameFirstChapter( user );
		expect( isButtonDisabled( 'Save' ) ).toBe( false );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Chapters saved.' ) );
		// A valid set announces success and nothing else.
		expect( mockWarningNotice ).not.toHaveBeenCalled();
		// The POSTed description is exactly the serializer's rewrite of the
		// current description with the session's rows.
		expect( api.metaPosts ).toHaveLength( 1 );
		expect( api.metaPosts[ 0 ].data ).toEqual( { id: 42, description: renamedDescription() } );
		// The VTT sync ran with the same description that was saved.
		expect( mockSyncChapters ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: GUID } ),
			renamedDescription()
		);

		// Re-baselined: the rename survives, the session is clean again.
		await waitFor( () => expect( isButtonDisabled( 'Save' ) ).toBe( true ) );
		expect( screen.getByLabelText( 'Chapter 1 title' ) ).toHaveValue( 'Renamed' );
	} );

	it( 'warns instead of announcing success when the saved chapters are invalid', async () => {
		const api: ApiState = {
			media: makeRawMediaWithDescription( INVALID_DESCRIPTION ),
			metaPosts: [],
		};
		installApi( api );
		const user = userEvent.setup();

		await renderReadyChapters();
		await renameFirstChapter( user );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		// The description is still written — it is the source of truth and
		// holds the user's prose — and the VTT sync still runs; it is that
		// sync which drops the auto-generated track for an invalid set.
		await waitFor( () => expect( api.metaPosts ).toHaveLength( 1 ) );
		expect( api.metaPosts[ 0 ].data ).toEqual( {
			id: 42,
			description: renamedDescription( INVALID_DESCRIPTION ),
		} );
		expect( mockSyncChapters ).toHaveBeenCalledWith(
			expect.objectContaining( { guid: GUID } ),
			renamedDescription( INVALID_DESCRIPTION )
		);

		// …but the outcome notice must not read as an unqualified success.
		expect( mockWarningNotice ).toHaveBeenCalledWith(
			'Chapters saved to the description, but they won’t appear in the player until they meet the requirements.'
		);
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'keeps chapters dirty and skips the VTT sync when the meta save fails', async () => {
		const api: ApiState = { media: makeRawMedia(), metaPosts: [] };
		api.onMetaPost = () => {
			throw new Error( 'meta save failed' );
		};
		installApi( api );
		const user = userEvent.setup();

		await renderReadyChapters();
		await renameFirstChapter( user );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () =>
			expect( mockErrorNotice ).toHaveBeenCalledWith( 'Failed to save chapters.' )
		);
		// The sync must never run over a description that failed to save,
		// and the session stays dirty for another attempt.
		expect( mockSyncChapters ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( 'Chapter 1 title' ) ).toHaveValue( 'Renamed' );
		expect( isButtonDisabled( 'Save' ) ).toBe( false );
	} );

	it( 'discards unsaved chapter changes through the confirm dialog', async () => {
		const api: ApiState = { media: makeRawMedia(), metaPosts: [] };
		installApi( api );
		const user = userEvent.setup();

		await renderReadyChapters();
		await renameFirstChapter( user );

		await user.click( screen.getByRole( 'button', { name: 'Discard changes' } ) );
		expect(
			screen.getByText(
				'Your unsaved chapter changes will be discarded and the chapters will return to the last saved version.'
			)
		).toBeInTheDocument();
		// Two buttons carry the "Discard changes" name while the dialog is
		// open (header + confirm); scope to the dialog.
		await user.click(
			within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Discard changes' } )
		);

		expect( screen.getByLabelText( 'Chapter 1 title' ) ).toHaveValue( 'Intro' );
		expect( isButtonDisabled( 'Save' ) ).toBe( true );
		expect( isButtonDisabled( 'Discard changes' ) ).toBe( true );
		// Nothing was posted anywhere.
		expect( api.metaPosts ).toHaveLength( 0 );
	} );

	it( 'blocks tab close via beforeunload only while dirty', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();

		await renderReadyChapters();

		const cleanEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( cleanEvent );
		expect( cleanEvent.defaultPrevented ).toBe( false );

		await renameFirstChapter( user );

		const dirtyEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( dirtyEvent );
		expect( dirtyEvent.defaultPrevented ).toBe( true );
	} );

	it( 'confirms sub-nav navigation while dirty and navigates on approval', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );

		await renderReadyChapters();
		await renameFirstChapter( user );

		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( confirmSpy ).toHaveBeenCalled();
		expect( navigate ).not.toHaveBeenCalled();

		confirmSpy.mockReturnValue( true );
		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42' } );

		confirmSpy.mockRestore();
	} );

	it( 'navigates without prompting while the session is clean', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' );

		await renderReadyChapters();
		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );

		expect( confirmSpy ).not.toHaveBeenCalled();
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42' } );

		confirmSpy.mockRestore();
	} );

	it( 'guards in-app link clicks (the breadcrumb) while dirty', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
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
			await renderReadyChapters();
			const link = screen.getByRole( 'link', { name: 'VideoPress' } );

			// Clean session: no prompt, navigation proceeds.
			await user.click( link );
			expect( confirmSpy ).not.toHaveBeenCalled();
			expect( linkClicks ).toEqual( [ false ] );

			await renameFirstChapter( user );

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
			confirmSpy.mockRestore();
		}
	} );

	it( 'guards browser back/forward while dirty', async () => {
		installApi( { media: makeRawMedia(), metaPosts: [] } );
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );

		await renderReadyChapters();

		// Clean session: the guard is not even attached.
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( confirmSpy ).not.toHaveBeenCalled();

		await renameFirstChapter( user );

		// Dirty + declined: re-navigate to the tab to cancel the traversal.
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( confirmSpy ).toHaveBeenCalledTimes( 1 );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );

		// Dirty + confirmed: let the router's own navigation stand.
		confirmSpy.mockReturnValue( true );
		navigate.mockClear();
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		expect( navigate ).not.toHaveBeenCalled();

		confirmSpy.mockRestore();
	} );
} );
