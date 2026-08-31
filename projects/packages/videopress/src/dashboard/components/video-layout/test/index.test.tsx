import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { render, screen } from '@testing-library/react';
import VideoLayout from '../index';
import type { ReactNode } from 'react';

// `Link` as well as `useNavigate`: the breadcrumbs this layout renders resolve
// their crumbs through it.
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn( () => jest.fn() ),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// Stubbed so these tests assert only that the layout mounts the shared notice,
// not the notice's own store wiring (which the connection package tests).
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	ConnectionError: jest.fn(),
	default: jest.fn(),
} ) );

const mockConnectionError = ConnectionError as jest.Mock;
const mockUseConnectionErrorNotice = useConnectionErrorNotice as jest.MockedFunction<
	typeof useConnectionErrorNotice
>;

const renderLayout = () =>
	render(
		<VideoLayout videoId="42" activeTab="details" breadcrumbLabel="A video">
			Video body
		</VideoLayout>
	);

describe( 'VideoLayout', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockConnectionError.mockReturnValue( null );
		mockUseConnectionErrorNotice.mockReturnValue( {
			hasConnectionError: true,
		} as ReturnType< typeof useConnectionErrorNotice > );
	} );

	it( 'renders the connection error notice above the per-video sub-nav', () => {
		mockConnectionError.mockReturnValue( <div>Connection error notice</div> );

		renderLayout();

		// Siblings, not nested, so the comparison is exactly "follows".
		const notice = screen.getByText( 'Connection error notice' );
		const tabList = screen.getByRole( 'tablist' );
		expect( notice.compareDocumentPosition( tabList ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'renders the notice with no props, so it matches the dashboard tabs', () => {
		renderLayout();

		expect( mockConnectionError ).toHaveBeenCalled();
		expect( mockConnectionError.mock.calls[ 0 ][ 0 ] ).toEqual( {} );
	} );

	it( 'leaves no notice behind when the connection is healthy', () => {
		mockUseConnectionErrorNotice.mockReturnValue( {
			hasConnectionError: false,
		} as ReturnType< typeof useConnectionErrorNotice > );

		renderLayout();

		expect( mockConnectionError ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Video body' ) ).toBeInTheDocument();
	} );
} );
