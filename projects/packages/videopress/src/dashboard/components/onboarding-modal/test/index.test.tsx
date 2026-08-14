import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { markFirstPublish } from '../../../hooks/use-first-run-state';
import { useOnboardingCounts } from '../../../hooks/use-onboarding-counts';
import OnboardingModal from '../index';

jest.mock( '../../../hooks/use-onboarding-counts', () => ( {
	useOnboardingCounts: jest.fn(),
} ) );

// The modal only OBSERVES the shared queue (the `useFreeTier` pattern); the
// real hook would stand up a resumable uploader nothing here needs.
let mockUploadQueue: Array< Record< string, unknown > > = [];
jest.mock( '../../../hooks/use-upload', () => ( {
	useUpload: () => ( { uploadQueue: mockUploadQueue } ),
} ) );

const queueRow = ( status: string ) => ( {
	id: `q-${ status }`,
	status,
	progress: 0.5,
	file: new File( [], 'clip.mp4' ),
	enqueuedAt: '2026-08-13T10:00:00.000Z',
} );

const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};
jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch,
} ) );

// The intro video reads global initial state and renders an iframe/video;
// none of that matters to the footer logic under test.
jest.mock( '../intro-video', () => ( {
	__esModule: true,
	default: () => null,
	INTRO_VIDEO_ASPECT: '16 / 9',
	// Not stubbed: the band's artwork is resolved by this exact helper, and
	// whether it resolves is what the artwork cases below are about.
	getAssetUrl: jest.requireActual( '../intro-video' ).getAssetUrl,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		site: { wpcom: { blog_id: 123 } },
		user: { current_user: { id: 7 } },
	} ),
	isWoASite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => false ),
} ) );

const mockCounts = ( counts: {
	videoPressCount: number;
	localCount: number;
	isSettled: boolean;
} ) => {
	( useOnboardingCounts as jest.Mock ).mockReturnValue( counts );
};

const WELCOME_FLAG = '__jetpackVideoPressWelcomeConsumed';
const WELCOME_ACTIVE_FLAG = '__jetpackVideoPressWelcomeActive';
const UPLOAD_STARTED_FLAG = '__jetpackVideoPressUploadStarted';

type WelcomeWindow = Window & {
	[ WELCOME_FLAG ]?: boolean;
	[ WELCOME_ACTIVE_FLAG ]?: boolean;
	[ UPLOAD_STARTED_FLAG ]?: boolean;
};

describe( 'OnboardingModal', () => {
	beforeEach( () => {
		window.localStorage.clear();
		mockNavigate.mockClear();
		mockUploadQueue = [];
		mockSearch = {};
		// Every latch here is window-scoped (they have to outlive the per-route
		// module copies), so each case starts from a fresh page load.
		delete ( window as WelcomeWindow )[ WELCOME_FLAG ];
		delete ( window as WelcomeWindow )[ WELCOME_ACTIVE_FLAG ];
		delete ( window as WelcomeWindow )[ UPLOAD_STARTED_FLAG ];
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=jetpack-videopress' );
	} );

	it( 'shows "Learn more" on a site with nothing to migrate', () => {
		mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /learn more/i } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /move/i } ) ).not.toBeInTheDocument();
	} );

	it( 'delivers the migration CTA with the real count when local videos exist', () => {
		mockCounts( { videoPressCount: 0, localCount: 12, isSettled: true } );

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'button', { name: 'Move 12 videos over' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /learn more/i } ) ).not.toBeInTheDocument();
	} );

	it( 'uses the singular label for one local video', () => {
		mockCounts( { videoPressCount: 0, localCount: 1, isSettled: true } );

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'button', { name: 'Move 1 video over' } ) ).toBeInTheDocument();
	} );

	it( 'dismisses and deep-links to the locally-filtered Library on migrate click', async () => {
		mockCounts( { videoPressCount: 0, localCount: 3, isSettled: true } );
		const user = userEvent.setup();

		render( <OnboardingModal /> );
		await user.click( screen.getByRole( 'button', { name: 'Move 3 videos over' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/?type=local' } );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'sends the primary CTA to the upload route', async () => {
		// With the widened gate the modal can open over Library or Home, so
		// the primary must navigate rather than merely reveal what's beneath.
		mockCounts( { videoPressCount: 0, localCount: 3, isSettled: true } );
		const user = userEvent.setup();

		render( <OnboardingModal /> );
		await user.click( screen.getByRole( 'button', { name: 'Upload a video' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/upload' } );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'stays closed once any VideoPress video exists', () => {
		mockCounts( { videoPressCount: 2, localCount: 5, isSettled: true } );

		render( <OnboardingModal /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	// Opening early would also risk the footer flickering between states as
	// the local count arrives — settling gates both concerns at once.
	it( 'stays closed until both counts settle', () => {
		mockCounts( { videoPressCount: 0, localCount: 0, isSettled: false } );

		render( <OnboardingModal /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'welcome=1 reopens the modal past every gate and clears the dismissal', () => {
		mockCounts( { videoPressCount: 4, localCount: 0, isSettled: true } );
		window.localStorage.setItem( 'jetpack-videopress-onboarding-seen-123-7', '1' );
		mockSearch = { welcome: '1' };

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( window.localStorage.getItem( 'jetpack-videopress-onboarding-seen-123-7' ) ).toBeNull();
	} );

	it( 'consumes welcome=1 once per page load, so a dismissal sticks', async () => {
		// Every route ships its own bundle, so an in-app navigation remounts
		// this component: without the latch the param re-cleared the dismissal
		// and re-opened the modal on every navigation of the same load.
		mockCounts( { videoPressCount: 4, localCount: 0, isSettled: true } );
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=jetpack-videopress&welcome=1' );
		const user = userEvent.setup();

		const { unmount } = render( <OnboardingModal /> );
		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		unmount();

		render( <OnboardingModal /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'stays open across the landing redirect the bare welcome URL triggers', async () => {
		// `admin.php?page=jetpack-videopress&welcome=1` resolves to Library,
		// which the layout immediately redirects away from — remounting this
		// component. Consumption is spent by then, so only the separate
		// window-scoped welcome flag can keep the modal open for the rest of
		// the load. Counted videos, because that is the reviewer's site.
		mockCounts( { videoPressCount: 4, localCount: 0, isSettled: true } );
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=jetpack-videopress&welcome=1' );

		const { unmount } = render( <OnboardingModal /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
		unmount();

		render( <OnboardingModal /> );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'strips welcome=1 from the URL so a manual reload behaves normally', () => {
		mockCounts( { videoPressCount: 4, localCount: 0, isSettled: true } );
		window.history.replaceState( {}, '', '/wp-admin/admin.php?page=jetpack-videopress&welcome=1' );

		render( <OnboardingModal /> );

		expect( window.location.search ).toBe( '?page=jetpack-videopress' );
	} );

	it( 'stays closed for a user who has already published', () => {
		mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );
		window.localStorage.setItem( 'jetpack-videopress-first-publish-123-7', '1' );

		render( <OnboardingModal /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	describe( 'an upload is under way', () => {
		// The reproduction: delete your last video, land on the Library, start an
		// upload. The library is legitimately empty, so the first-run gate
		// reopens — and the welcome modal covers the screen with the progress
		// panel still running behind it.
		it( 'stands down while an upload is in flight', () => {
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );
			mockUploadQueue = [ queueRow( 'uploading' ) ];

			render( <OnboardingModal /> );

			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		// The queue is not a durable record: a failed row leaves it the moment
		// the user retries or clears it, and greeting them as brand new right
		// then would be the worst version of this bug, not a fix for it.
		it( 'stays down once the queue is cleared again', () => {
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );
			mockUploadQueue = [ queueRow( 'failed' ) ];
			const { rerender } = render( <OnboardingModal /> );

			mockUploadQueue = [];
			rerender( <OnboardingModal /> );

			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		// Each route ships its own bundle, so navigating mid-upload remounts
		// this component with a fresh module scope — hence the window latch.
		it( 'stays down across the remount an in-app navigation causes', () => {
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );
			mockUploadQueue = [ queueRow( 'uploading' ) ];
			const { unmount } = render( <OnboardingModal /> );
			unmount();

			mockUploadQueue = [];
			render( <OnboardingModal /> );

			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		// `welcome=1` is a reviewer explicitly asking for the modal, and it
		// already overrides every other gate here.
		it( 'still honours the welcome preview param', () => {
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );
			mockUploadQueue = [ queueRow( 'uploading' ) ];
			mockSearch = { welcome: '1' };

			render( <OnboardingModal /> );

			expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'a library that used to have videos', () => {
		// Deleting the last video is the gate's blind spot: the count is right
		// that the library is empty and wrong about what that means. The flag is
		// what carries the difference — and it is written by
		// `useObserveFirstRunSignals`, mounted for every route, not by this
		// component, which only some routes mount. Seeded here as that observer
		// would have seeded it on arrival.
		it( 'stays closed after the last video is deleted', () => {
			markFirstPublish();
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );

			render( <OnboardingModal /> );

			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );

		// The write does not belong here: this component is mounted by the
		// dashboard chrome only, so a load that stayed on /video/:id recorded
		// nothing — and the modal then greeted an established user as brand new.
		it( 'leaves the publish flag to the shared observer', () => {
			mockCounts( { videoPressCount: 2, localCount: 0, isSettled: true } );

			render( <OnboardingModal /> );

			expect( window.localStorage.getItem( 'jetpack-videopress-first-publish-123-7' ) ).toBeNull();
		} );
	} );

	// The band's artwork cannot be addressed from the stylesheet: the CSS is
	// injected by JS, so a relative `url(images/…)` resolves against
	// `/wp-admin/` and 404s. It travels as a custom property instead.
	describe( 'band artwork', () => {
		const BUILD_URL = 'https://example.com/wp-content/plugins/videopress/build/';

		/**
		 * Set (or clear) the boot payload the asset URL is resolved against.
		 *
		 * @param buildUrl - Build URL to expose, or undefined for no payload.
		 */
		function setBuildUrl( buildUrl?: string ) {
			( global as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
				buildUrl === undefined ? undefined : { assets: { buildUrl } };
		}

		/**
		 * The modal renders through a portal, so the band is looked up in the
		 * document rather than the render container.
		 *
		 * @return The band element.
		 */
		function getBand(): HTMLElement {
			// eslint-disable-next-line testing-library/no-node-access -- the band is a presentational div with no role or accessible name; no query reaches it.
			const band = document.querySelector< HTMLElement >( '.vp-onboarding-modal__media' );
			expect( band ).not.toBeNull();

			return band as HTMLElement;
		}

		afterEach( () => {
			delete ( global as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } )
				.JPVIDEOPRESS_INITIAL_STATE;
		} );

		it( 'resolves the wireframe against the build URL, not /wp-admin/', () => {
			setBuildUrl( BUILD_URL );
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );

			render( <OnboardingModal /> );

			expect( getBand().style.getPropertyValue( '--vp-intro-artwork' ) ).toBe(
				`url("${ BUILD_URL }dashboard/onboarding-modal/images/videopress-wireframe.svg")`
			);
		} );

		// A bad or missing base costs the band its artwork, never the dashboard:
		// the property is simply absent and the stylesheet's flat #003010 shows.
		it( 'falls back to the flat band when the URL cannot be built', () => {
			setBuildUrl( undefined );
			mockCounts( { videoPressCount: 0, localCount: 0, isSettled: true } );

			render( <OnboardingModal /> );

			expect( getBand().style.getPropertyValue( '--vp-intro-artwork' ) ).toBe( '' );
		} );
	} );
} );
