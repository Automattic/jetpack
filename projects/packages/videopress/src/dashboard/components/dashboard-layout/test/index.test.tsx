import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { render, screen } from '@testing-library/react';
import { useNavigate } from '@wordpress/route';
import DashboardLayout from '../index';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
} ) );

// Stubbed so these tests assert only that the layout mounts the shared notice,
// not the notice's own store wiring (which the connection package tests).
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	ConnectionError: jest.fn(),
	default: jest.fn(),
} ) );

// The layout's other child reaches react-query (useOnboardingCounts → useLibrary),
// which would need a QueryClientProvider these tests have no use for. Nothing here
// asserts on the modal, so stub it rather than stand up the query machinery.
jest.mock( '../../onboarding-modal', () => ( {
	__esModule: true,
	default: () => null,
} ) );
// The upload pill reads the shared queue through react-query; it has a suite
// of its own and no QueryClientProvider here.
jest.mock( '../../upload-pill', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const mockUseNavigate = useNavigate as jest.Mock;
const mockConnectionError = ConnectionError as jest.Mock;
const mockUseConnectionErrorNotice = useConnectionErrorNotice as jest.MockedFunction<
	typeof useConnectionErrorNotice
>;

describe( 'DashboardLayout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseNavigate.mockReturnValue( jest.fn() );
		mockConnectionError.mockReturnValue( null );
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
