import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardLayout from '../index';
import type { FirstRunState } from '../../../hooks/use-first-run-state';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
} ) );

// Renders the actions slot too: whether the header offers an action while the
// page under it is still being decided is part of what this suite checks.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: ReactNode; actions?: ReactNode } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );

// Both carry their own queries and neither is under test here.
jest.mock( '../../onboarding-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '../../upload-pill', () => ( {
	__esModule: true,
	default: () => null,
} ) );

let mockFirstRun: FirstRunState = 'home';
let mockSettled: FirstRunState | 'loading' = 'home';
jest.mock( '../../../hooks/use-first-run-state', () => ( {
	useFirstRunState: () => mockFirstRun,
	useSettledFirstRunState: () => mockSettled,
} ) );

const LANDING_FLAG = '__jetpackVideoPressLandingRedirectDone';

/**
 * Point jsdom at a wp-admin URL, with or without the app's `p` path param.
 *
 * @param search - The raw query string, without the leading `?`.
 */
function setLocation( search: string ) {
	window.history.replaceState( {}, '', `/wp-admin/admin.php?${ search }` );
}

describe( 'DashboardLayout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		delete ( window as Window & { [ LANDING_FLAG ]?: boolean } )[ LANDING_FLAG ];
		mockFirstRun = 'home';
		mockSettled = 'home';
		setLocation( 'page=jetpack-videopress' );
	} );

	describe( 'landing redirect', () => {
		it( 'routes a bare landing to Home for a returning user', () => {
			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( mockNavigate ).toHaveBeenCalledWith( { href: '/home' } );
		} );

		it( 'routes a bare landing to Upload on a genuine first run', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'first-run';

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( mockNavigate ).toHaveBeenCalledWith( { href: '/upload' } );
		} );

		it( 'leaves a deliberate arrival at Library alone', () => {
			// In wp-admin the app's own path travels in `p`, so its presence is
			// what separates an in-app navigation (or a reload of one) from a
			// bare landing. Without this check every such arrival was hijacked.
			setLocation( 'page=jetpack-videopress&p=%2F' );

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( mockNavigate ).not.toHaveBeenCalled();
		} );

		it( 'leaves a Library deep link with search payload alone', () => {
			setLocation( 'page=jetpack-videopress&p=%2F%3Ftype%3Dlocal' );

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( mockNavigate ).not.toHaveBeenCalled();
		} );

		it( 'fires at most once per page load', () => {
			const { unmount } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );
			unmount();
			mockNavigate.mockClear();

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( mockNavigate ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'tab order', () => {
		it( 'holds the settled order for the life of the mount', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'first-run';
			const { rerender } = render( <DashboardLayout activeTab="upload">body</DashboardLayout> );
			expect( screen.getByRole( 'tab', { name: 'Upload' } ) ).toBeInTheDocument();

			// The first successful upload flips this mid-session; the strip must
			// not re-order under the cursor of someone still finishing the flow
			// that caused it.
			mockFirstRun = 'home';
			mockSettled = 'home';
			rerender( <DashboardLayout activeTab="upload">body</DashboardLayout> );

			expect( screen.getByRole( 'tab', { name: 'Upload' } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'tab', { name: 'Home' } ) ).not.toBeInTheDocument();
		} );

		it( 'renders the live order until the count settles', () => {
			// A loading count reads as first-run, so a brand-new user never sees
			// the returning-user strip; freezing that guess would make it
			// permanent for the mount.
			mockFirstRun = 'first-run';
			mockSettled = 'loading';
			const { rerender } = render( <DashboardLayout activeTab="upload">body</DashboardLayout> );
			expect( screen.getByRole( 'tab', { name: 'Upload' } ) ).toBeInTheDocument();

			mockFirstRun = 'home';
			mockSettled = 'home';
			rerender( <DashboardLayout activeTab="home">body</DashboardLayout> );

			expect( screen.getByRole( 'tab', { name: 'Home' } ) ).toBeInTheDocument();
		} );

		// The optimistic order is a guess, and on the WordPress menu link it was
		// a visible one: the first-run strip painted with Library active, then
		// the leading tab renamed itself from Upload to Home when the count
		// landed. The body is already held back over that window, so the strip
		// waits with it rather than guessing.
		it( 'shows no tabs on a bare landing until the count settles', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryAllByRole( 'tab' ) ).toHaveLength( 0 );
		} );

		// The count settling is not the user arriving anywhere: the redirect it
		// unblocks is still one effect and one route bundle away. Revealing the
		// strip here painted `Library` as the active tab — first with the
		// first-run order, then with the returning one — on a route the user was
		// about to be taken off.
		it( 'keeps the strip held once the bare landing settles', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';
			const { rerender } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			mockFirstRun = 'home';
			mockSettled = 'home';
			rerender( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryAllByRole( 'tab' ) ).toHaveLength( 0 );
		} );

		// Panels are rendered by mapping over the tab order, so a route whose tab
		// has dropped out of that order renders its children nowhere. Normal use
		// reaches it: the first successful upload flips the state to `home`,
		// which drops Upload from the order while the user is still standing on
		// /upload finishing the details step.
		it( 'keeps the active tab in the order when the order has dropped it', () => {
			mockFirstRun = 'home';
			mockSettled = 'home';

			render( <DashboardLayout activeTab="upload">body</DashboardLayout> );

			expect( screen.getByText( 'body' ) ).toBeInTheDocument();
			// Re-inserted in its canonical position rather than appended, so the
			// strip does not re-order around the tab the user is standing on.
			expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
				'Home',
				'Upload',
				'Library',
				'Analytics',
				'Settings',
			] );
		} );

		// Only the bare landing is ambiguous. Anywhere the user chose the route,
		// the optimistic order still renders immediately — a brand-new user must
		// not sit tabless while their count loads.
		it( 'keeps the optimistic strip on an in-app arrival', () => {
			setLocation( 'page=jetpack-videopress&p=%2F' );
			mockFirstRun = 'first-run';
			mockSettled = 'loading';

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.getByRole( 'tab', { name: 'Upload' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'tab navigation', () => {
		// The tabs are sibling routes, so activating one is a navigation rather
		// than local state: the strip's value comes back from the route.
		it( 'navigates to the activated tab path', async () => {
			const user = userEvent.setup();
			render( <DashboardLayout activeTab="home">body</DashboardLayout> );

			await user.click( screen.getByRole( 'tab', { name: 'Analytics' } ) );
			expect( mockNavigate ).toHaveBeenCalledWith( { href: '/stats' } );

			// Library owns `/`, which is the one path that is not its own name.
			await user.click( screen.getByRole( 'tab', { name: 'Library' } ) );
			expect( mockNavigate ).toHaveBeenLastCalledWith( { href: '/' } );
		} );
	} );

	describe( 'landing body', () => {
		it( 'holds the body back on a bare landing until the count settles', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryByText( 'body' ) ).not.toBeInTheDocument();
		} );

		// The frame the walkthrough caught: a brand-new user's first painted
		// screen was an empty Library — DataViews' "No results", its search field
		// and its view controls — because the render that reveals the count
		// commits before the effect that redirects can run.
		it( 'keeps the body held once the bare landing settles', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';
			const { rerender } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			mockSettled = 'first-run';
			rerender( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryByText( 'body' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		} );

		// The second gap: committing the redirect rewrites the URL to the
		// destination's `p` immediately, but the destination's route bundle takes
		// another ~400ms to paint, and this component is mounted for all of it. A
		// hold that re-reads the URL lets go exactly there.
		it( 'keeps the body held while the destination route loads', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';
			const { rerender } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			// What the committed redirect leaves behind: /upload in the URL, with
			// Library still the mounted route.
			setLocation( 'page=jetpack-videopress&p=%2Fupload' );
			mockSettled = 'first-run';
			rerender( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryByText( 'body' ) ).not.toBeInTheDocument();
			expect( screen.queryAllByRole( 'tab' ) ).toHaveLength( 0 );
		} );

		it( 'renders the body on an arrival the user chose', () => {
			setLocation( 'page=jetpack-videopress&p=%2F' );

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.getByText( 'body' ) ).toBeInTheDocument();
		} );

		// The once-per-load flag is what keeps the hold from being permanent:
		// after the landing decision is spent, a Library render can only be the
		// user's own arrival, bare URL or not.
		it( 'renders the body on a bare URL once the landing decision is spent', () => {
			const { unmount } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );
			unmount();

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.getByText( 'body' ) ).toBeInTheDocument();
		} );

		// Held back is not finished. Without something in that gap the page was
		// a header, a tagline and half a second of nothing — which reads as a
		// dashboard that loaded empty, not one that is still loading.
		it( 'shows a loading affordance while the landing decision is pending', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		} );

		it( 'drops the loading affordance on an arrival the user chose', () => {
			setLocation( 'page=jetpack-videopress&p=%2F' );

			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'header actions', () => {
		const uploadAction = (
			<button type="button">{ 'Upload video' /* stand-in for the routes' own */ }</button>
		);

		// The Library's real button reads `aria-disabled=false` until its plan
		// count lands, so over this window the page offered an action it was
		// about to both refuse and replace.
		it( 'withholds them while the landing decision is pending', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'loading';

			render(
				<DashboardLayout activeTab="library" actions={ uploadAction }>
					body
				</DashboardLayout>
			);

			expect( screen.queryByRole( 'button', { name: 'Upload video' } ) ).not.toBeInTheDocument();
		} );

		// The live button the walkthrough photographed: a settled count is not an
		// arrival, so the action stayed withheld for the whole handoff.
		it( 'withholds them for the whole bare landing, settled or not', () => {
			const { rerender } = render(
				<DashboardLayout activeTab="library" actions={ uploadAction }>
					body
				</DashboardLayout>
			);

			setLocation( 'page=jetpack-videopress&p=%2Fupload' );
			rerender(
				<DashboardLayout activeTab="library" actions={ uploadAction }>
					body
				</DashboardLayout>
			);

			expect( screen.queryByRole( 'button', { name: 'Upload video' } ) ).not.toBeInTheDocument();
		} );

		it( 'renders them on an arrival the user chose', () => {
			setLocation( 'page=jetpack-videopress&p=%2F' );

			render(
				<DashboardLayout activeTab="library" actions={ uploadAction }>
					body
				</DashboardLayout>
			);

			expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();
		} );
	} );
} );
