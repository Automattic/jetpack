import { render, screen } from '@testing-library/react';
import DashboardLayout from '../index';
import type { FirstRunState } from '../../../hooks/use-first-run-state';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: () => mockNavigate,
} ) );

jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
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
	} );
} );
