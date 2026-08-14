import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOnboardingCounts } from '../../../hooks/use-onboarding-counts';
import OnboardingModal from '../index';

jest.mock( '../../../hooks/use-onboarding-counts', () => ( {
	useOnboardingCounts: jest.fn(),
} ) );

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

describe( 'OnboardingModal', () => {
	beforeEach( () => {
		window.localStorage.clear();
		mockNavigate.mockClear();
		mockSearch = {};
		// The consumed latch is window-scoped (it has to outlive the per-route
		// module copies), so each case starts from a fresh page load.
		delete ( window as Window & { [ WELCOME_FLAG ]?: boolean } )[ WELCOME_FLAG ];
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
} );
