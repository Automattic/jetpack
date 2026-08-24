import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
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

// Renders the actions slot too, so the header behavior stays covered.
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
// Stubbed so these tests assert only that the layout mounts the shared notice,
// not the notice's own store wiring (which the connection package tests).
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	ConnectionError: jest.fn(),
	default: jest.fn(),
} ) );

jest.mock( '../../onboarding-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '../../upload-pill', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const mockConnectionError = ConnectionError as jest.Mock;
const mockUseConnectionErrorNotice = useConnectionErrorNotice as jest.MockedFunction<
	typeof useConnectionErrorNotice
>;

let mockFirstRun: FirstRunState = 'home';
let mockSettled: FirstRunState | 'loading' = 'home';
jest.mock( '../../../hooks/use-first-run-state', () => ( {
	useFirstRunState: () => mockFirstRun,
	useSettledFirstRunState: () => mockSettled,
} ) );

describe( 'DashboardLayout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockConnectionError.mockReturnValue( null );
		mockUseConnectionErrorNotice.mockReturnValue( {
			hasConnectionError: false,
		} as ReturnType< typeof useConnectionErrorNotice > );
		mockFirstRun = 'home';
		mockSettled = 'home';
	} );

	describe( 'landing', () => {
		// The Library owns `/` and is the landing tab; there is no redirect to
		// burn and no hold to sit through. The Library route itself decides
		// between the listing and the upload onboarding empty state.
		it( 'renders the Library body immediately, with no redirect', () => {
			render( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.getByText( 'body' ) ).toBeInTheDocument();
			expect( mockNavigate ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'tab order', () => {
		it( 'holds the settled order for the life of the mount', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'first-run';
			const { rerender } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );
			expect( screen.queryByRole( 'tab', { name: 'Home' } ) ).not.toBeInTheDocument();

			// The first successful upload flips this mid-session; the strip must
			// not re-order under the cursor of someone still finishing the flow
			// that caused it.
			mockFirstRun = 'home';
			mockSettled = 'home';
			rerender( <DashboardLayout activeTab="library">body</DashboardLayout> );

			expect( screen.queryByRole( 'tab', { name: 'Home' } ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'tab', { name: 'Library' } ) ).toBeInTheDocument();
		} );

		it( 'renders the live order until the count settles', () => {
			// A loading count reads as first-run, so a brand-new user never sees
			// the returning-user strip; freezing that guess would make it
			// permanent for the mount.
			mockFirstRun = 'first-run';
			mockSettled = 'loading';
			const { rerender } = render( <DashboardLayout activeTab="library">body</DashboardLayout> );
			expect( screen.queryByRole( 'tab', { name: 'Home' } ) ).not.toBeInTheDocument();

			mockFirstRun = 'home';
			mockSettled = 'home';
			rerender( <DashboardLayout activeTab="home">body</DashboardLayout> );

			expect( screen.getByRole( 'tab', { name: 'Home' } ) ).toBeInTheDocument();
		} );

		// Panels are rendered by mapping over the tab order, so a route whose tab
		// has dropped out of that order renders its children nowhere. Normal use
		// reaches it: a first-run order carries no Home tab, but a deep link to
		// /home still mounts that route.
		it( 'keeps the active tab in the order when the order has dropped it', () => {
			mockFirstRun = 'first-run';
			mockSettled = 'first-run';

			render( <DashboardLayout activeTab="home">body</DashboardLayout> );

			expect( screen.getByText( 'body' ) ).toBeInTheDocument();
			// Re-inserted in its canonical position rather than appended, so the
			// strip does not re-order around the tab the user is standing on.
			expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
				'Home',
				'Library',
				'Analytics',
				'Settings',
			] );
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

	describe( 'header actions', () => {
		it( 'renders the actions slot with the page', () => {
			render(
				<DashboardLayout
					activeTab="library"
					actions={ <button type="button">{ 'Upload video' }</button> }
				>
					body
				</DashboardLayout>
			);

			expect( screen.getByRole( 'button', { name: 'Upload video' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'connection error notice', () => {
		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
			} as ReturnType< typeof useConnectionErrorNotice > );
		} );

		it( 'renders the connection error notice above the tabs', () => {
			mockConnectionError.mockReturnValue( <div>Connection error notice</div> );

			render( <DashboardLayout activeTab="library">Library body</DashboardLayout> );

			const notice = screen.getByText( 'Connection error notice' );
			expect( notice ).toBeInTheDocument();

			// Above the strip, so it can't scroll away with a tab's body. The two are
			// siblings, not nested, so the comparison is exactly "follows".
			const tabList = screen.getByRole( 'tablist' );
			expect( notice.compareDocumentPosition( tabList ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		} );

		it( 'renders the notice with no props, so every tab describes the error the same way', () => {
			render( <DashboardLayout activeTab="settings">Settings body</DashboardLayout> );

			expect( mockConnectionError ).toHaveBeenCalled();
			expect( mockConnectionError.mock.calls[ 0 ][ 0 ] ).toEqual( {} );
		} );

		it( 'leaves no notice behind when the connection is healthy', () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: false,
			} as ReturnType< typeof useConnectionErrorNotice > );

			render( <DashboardLayout activeTab="library">Library body</DashboardLayout> );

			expect( mockConnectionError ).not.toHaveBeenCalled();
			expect( screen.getByText( 'Library body' ) ).toBeInTheDocument();
		} );
	} );
} );
