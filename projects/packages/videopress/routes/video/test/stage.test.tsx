import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import { resetFeatures, setFeatures } from '../../../src/dashboard/test-utils/features';
import { mockApiFetch } from '../../../src/dashboard/test-utils/mock-api-fetch';
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
	// ChaptersSummary builds its deep link through useLinkProps.
	useLinkProps: ( { to }: { to: string } ) => ( { href: to } ),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// The AdminPage/Breadcrumbs chrome needs the full admin shell; reduce it to
// the slots the tests interact with (breadcrumbs, actions, body).
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
// Renders `items` rather than a hardcoded trail, splitting link-vs-<h1> the
// way the real component does (@wordpress/admin-ui breadcrumbs/index.tsx:
// every item but the last is a router link; the last, when it carries no
// `to`, is the page's only <h1>). The live-title cases below read that
// heading, so a hardcoded stub would make them assert nothing.
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: { label: string; to?: string }[] } ) => {
		const last = items[ items.length - 1 ];
		return (
			<nav>
				<ul>
					{ items.slice( 0, -1 ).map( ( item, index ) => (
						<li key={ index }>
							<a href={ item.to }>{ item.label }</a>
						</li>
					) ) }
					<li>{ last.to ? <a href={ last.to }>{ last.label }</a> : <h1>{ last.label }</h1> }</li>
				</ul>
			</nav>
		);
	},
} ) );

// Variables referenced inside jest.mock() factories must be prefixed with
// "mock" (case-insensitive) to satisfy Jest's babel-jest hoisting rules.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
const mockInfoNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
		createInfoNotice: mockInfoNotice,
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

// Heavy children irrelevant to the wiring under test (VideoNav, the dirty-form
// guard, and the save → chapters-sync sequencing). The form fields the tests
// type into live in VideoDetailsCard, which stays real.
jest.mock( '../../../src/dashboard/components/video-details/preview-player', () => ( {
	__esModule: true,
	default: () => <div data-testid="preview-player" />,
} ) );
jest.mock( '../../../src/dashboard/components/video-details/video-info-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="video-info-card" />,
} ) );
// Both carry their own queries — the poster mutation and frame picker in one,
// the tracks fetch in the other — which would otherwise mount against this
// file's catch-all apiFetch handler. VideoDetailsCard stays real; the tests
// type into its fields.
jest.mock( '../../../src/dashboard/components/video-details/thumbnail-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="thumbnail-card" />,
} ) );
jest.mock( '../../../src/dashboard/components/video-details/subtitles-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="subtitles-card" />,
} ) );
jest.mock( '../../../src/dashboard/components/video-details/privacy-sharing-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="privacy-sharing-card" />,
} ) );
jest.mock( '../../../src/dashboard/components/video-details/rating-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="rating-card" />,
} ) );
jest.mock( '../../../src/dashboard/components/video-details/chapters-help-modal', () => ( {
	__esModule: true,
	default: ( { isOpen }: { isOpen: boolean } ) =>
		isOpen ? <div data-testid="chapters-help-modal" /> : null,
} ) );
jest.mock( '../../../src/client/components/caption-manager-modal/lazy', () => ( {
	__esModule: true,
	default: () => <div data-testid="caption-manager-modal" />,
} ) );

// The chapters VTT sync drives the tracks endpoints through its own pipeline
// (covered by the shared sync core's tests); here only whether — and with
// which description — it is invoked matters. It never rejects by contract.
const mockSyncChapters = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-update-chapters', () => ( {
	useUpdateChapters: () => ( { syncChapters: mockSyncChapters } ),
} ) );

// Capture updateMeta calls without executing the mutation, so each test can
// fire the stage's onSuccess/onError callbacks deterministically.
const mockUpdateMeta = jest.fn();
jest.mock( '../../../src/dashboard/hooks/use-update-video-meta', () => ( {
	useUpdateVideoMeta: () => ( { mutate: mockUpdateMeta, isPending: false } ),
} ) );

const mockUseNavigate = useNavigate as jest.Mock;

const GUID = 'abc123';
const DESCRIPTION = '00:00 Intro\n00:30 Middle';

/**
 * Build a raw /wp/v2/media item for useVideo.
 *
 * @return A raw media item.
 */
function makeRawMedia() {
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
			description: DESCRIPTION,
		},
	};
}

/**
 * Install an apiFetch handler serving the media fixture. The meta save is a
 * mocked hook and deletes aren't exercised, so /wp/v2/media/{id} is the only
 * endpoint this stage reads here.
 */
function installApi() {
	const media = makeRawMedia();
	mockApiFetch( ( { path = '' } ) => {
		if ( path.startsWith( '/wp/v2/media/' ) ) {
			return media;
		}
		return {};
	} );
}

/**
 * Render the stage and wait for the editor form to appear.
 *
 * @return The render result.
 */
async function renderReadyStage() {
	const view = render( <Stage />, { wrapper: createTestWrapper( mockTestClient ) } );
	await expect( screen.findByLabelText( 'Title' ) ).resolves.toBeInTheDocument();
	return view;
}

/**
 * Pull the vars and mutate-level callbacks out of the sole updateMeta call.
 *
 * @return The mutation vars and callbacks.
 */
function metaCall() {
	expect( mockUpdateMeta ).toHaveBeenCalledTimes( 1 );
	const [ vars, callbacks ] = mockUpdateMeta.mock.calls[ 0 ] as [
		{ id: string; patch: { title?: string; description?: string } },
		{ onSuccess: () => void; onError: () => void },
	];
	return { vars, callbacks };
}

describe( 'video stage', () => {
	let navigate: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();
		mockTestClient = createTestQueryClient();
		navigate = jest.fn();
		mockUseNavigate.mockReturnValue( navigate );
		mockSyncChapters.mockResolvedValue( 'uploaded' );
		installApi();
		// The sub-nav is gated on the chapters editor; the tests below that
		// exercise it need the gate on. The gate's own cases flip it back.
		setFeatures( { chaptersEditor: true } );
	} );

	afterEach( () => {
		resetFeatures();
	} );

	/*
	 * The layout contract. The player is a grid sibling of the canvas and the
	 * settings panel, not a child of either, because it is placed by grid area —
	 * that is what lets the stacked layout below 1100px lead with the player
	 * while the settings stay last. Nesting it inside the panel would look
	 * equivalent and silently invert the narrow-viewport order, so pin that it
	 * is outside.
	 */
	it( 'keeps the player out of the settings panel', async () => {
		await renderReadyStage();

		const panel = screen.getByRole( 'complementary', { name: 'Video settings' } );

		expect( within( panel ).getByTestId( 'video-info-card' ) ).toBeInTheDocument();
		expect( within( panel ).queryByTestId( 'preview-player' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'preview-player' ) ).toBeInTheDocument();
	} );

	/*
	 * The split is authoring vs. configuring, not editable vs. read-only. The
	 * canvas holds what a person writes; the panel holds the read-outs plus the
	 * settings picked once from a fixed set. Named cards rather than a count, so
	 * putting one in the wrong column fails here.
	 */
	it( 'groups the settings with the read-outs, and the authoring outside them', async () => {
		await renderReadyStage();

		const panel = screen.getByRole( 'complementary', { name: 'Video settings' } );

		// Configured once, then left alone.
		expect( within( panel ).getByTestId( 'privacy-sharing-card' ) ).toBeInTheDocument();
		expect( within( panel ).getByTestId( 'rating-card' ) ).toBeInTheDocument();

		// Authored — on the canvas, so present on the page but not in the panel.
		expect( screen.getByTestId( 'thumbnail-card' ) ).toBeInTheDocument();
		expect( within( panel ).queryByTestId( 'thumbnail-card' ) ).not.toBeInTheDocument();
		expect( within( panel ).queryByTestId( 'subtitles-card' ) ).not.toBeInTheDocument();
		expect( within( panel ).queryByLabelText( 'Title' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Details / Editor sub-nav with Details active', async () => {
		await renderReadyStage();

		expect( screen.getByRole( 'tab', { name: 'Details', selected: true } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Editor', selected: false } ) ).toBeInTheDocument();
	} );

	// With the chapters editor off the Editor route is stripped server-side,
	// leaving a pointless one-tab strip whose only sibling would dead-end.
	it( 'hides the sub-nav entirely when the chapters editor is off', async () => {
		setFeatures( { chaptersEditor: false } );

		await renderReadyStage();

		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		// Everything else on the page is unchanged.
		expect( screen.getByLabelText( 'Title' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Description' ) ).toBeInTheDocument();
	} );

	it( 'navigates to the Editor tab without prompting while the form is clean', async () => {
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' );

		await renderReadyStage();
		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );

		expect( confirmSpy ).not.toHaveBeenCalled();
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );

		confirmSpy.mockRestore();
	} );

	it( 'confirms sub-nav navigation while the form is dirty and navigates on approval', async () => {
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );

		await renderReadyStage();
		await user.type( screen.getByLabelText( 'Title' ), '!' );

		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );
		expect( confirmSpy ).toHaveBeenCalledWith(
			'You have unsaved changes. Leave this page and discard them?'
		);
		expect( navigate ).not.toHaveBeenCalled();

		confirmSpy.mockReturnValue( true );
		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );

		confirmSpy.mockRestore();
	} );

	it( 'regenerates the chapters VTT only after a successful save that changed the description', async () => {
		const user = userEvent.setup();

		await renderReadyStage();
		await user.type( screen.getByLabelText( 'Description' ), '!' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		const { vars, callbacks } = metaCall();
		expect( vars.id ).toBe( '42' );
		expect( vars.patch.description ).toBe( `${ DESCRIPTION }!` );
		// The sync must not run before the meta save settles: syncing first
		// would bake a never-persisted description into the VTT.
		expect( mockSyncChapters ).not.toHaveBeenCalled();

		await act( async () => {
			callbacks.onSuccess();
		} );

		expect( mockSyncChapters ).toHaveBeenCalledTimes( 1 );
		expect( mockSyncChapters ).toHaveBeenCalledWith(
			expect.objectContaining( { id: '42', guid: GUID } ),
			`${ DESCRIPTION }!`
		);
		expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Video details saved.' );
	} );

	it( 'skips the chapters sync when only the title changed', async () => {
		const user = userEvent.setup();

		await renderReadyStage();
		await user.type( screen.getByLabelText( 'Title' ), '!' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		const { vars, callbacks } = metaCall();
		expect( vars.patch.title ).toBe( 'My Clip!' );

		await act( async () => {
			callbacks.onSuccess();
		} );

		// The description didn't change, so the VTT is already in sync.
		expect( mockSyncChapters ).not.toHaveBeenCalled();
		expect( mockSuccessNotice ).toHaveBeenCalledWith( 'Video details saved.' );
	} );

	// The crumb is the page's <h1>. It reads the form's live value, so it has
	// to follow typing — and it must not turn typing into a save.
	it( 'tracks the title in the breadcrumb heading as it is typed, without saving', async () => {
		const user = userEvent.setup();

		await renderReadyStage();
		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'My Clip' );

		await user.type( screen.getByLabelText( 'Title' ), ' 2' );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'My Clip 2' );
		expect( mockUpdateMeta ).not.toHaveBeenCalled();
	} );

	// An empty label renders an empty <h1>, which would leave the page with no
	// accessible name mid-edit; whitespace has to count as empty too.
	it( 'falls back to Untitled when the title is cleared or only whitespace', async () => {
		const user = userEvent.setup();

		await renderReadyStage();
		await user.clear( screen.getByLabelText( 'Title' ) );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Untitled' );

		await user.type( screen.getByLabelText( 'Title' ), '   ' );

		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( 'Untitled' );
	} );

	it( 'skips the chapters sync and shows an error when the meta save fails', async () => {
		const user = userEvent.setup();

		await renderReadyStage();
		await user.type( screen.getByLabelText( 'Description' ), '!' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		const { callbacks } = metaCall();
		await act( async () => {
			callbacks.onError();
		} );

		expect( mockSyncChapters ).not.toHaveBeenCalled();
		expect( mockErrorNotice ).toHaveBeenCalledWith( 'Failed to save video details.' );
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );
} );
