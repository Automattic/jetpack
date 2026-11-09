/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createContext, useContext, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import VideoPlayer from '../render';

const mockGetEntityRecord = jest.fn();
const mockHasFinishedResolution = jest.fn();
const mockGetResolutionError = jest.fn();
const mockInvalidateResolution = jest.fn();

let mockPageParams: Record< string, unknown > = {};

type FakeWidgetRootProps = {
	attributes?: { reportParams?: Record< string, unknown > };
	children: ReactNode;
};

const mockRootContext = createContext< { reportParams: Record< string, unknown > } >( {
	reportParams: {},
} );
const mockUseRootContext = () => useContext( mockRootContext );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { invalidateResolution: mockInvalidateResolution } ),
	useSelect: ( selector: ( select: () => Record< string, jest.Mock > ) => unknown ) =>
		selector( () => ( {
			getEntityRecord: mockGetEntityRecord,
			hasFinishedResolution: mockHasFinishedResolution,
			getResolutionError: mockGetResolutionError,
		} ) ),
} ) );

jest.mock( '../../../src/client/lib/get-media-token', () => ( {
	__esModule: true,
	default: () => Promise.resolve( { token: null } ),
} ) );

type WidgetStateProps = {
	isLoading: boolean;
	isError: boolean;
	isEmpty?: boolean;
	error?: { description?: string; actions?: Array< { label: string; onClick: () => void } > };
	empty?: { description?: string };
	children: ReactNode;
};

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	// Resolves like the real root: non-empty host `reportParams`, otherwise the page's params.
	WidgetRoot: ( { attributes, children }: FakeWidgetRootProps ) => {
		const hostParams = attributes?.reportParams;
		const reportParams =
			hostParams && Object.keys( hostParams ).length > 0 ? hostParams : mockPageParams;

		return (
			<mockRootContext.Provider value={ { reportParams } }>{ children }</mockRootContext.Provider>
		);
	},
	WidgetState: ( { isLoading, isError, isEmpty, error, empty, children }: WidgetStateProps ) => {
		if ( isError ) {
			return (
				<div role="alert">
					<p>{ error?.description }</p>
					{ error?.actions?.map( action => (
						<button key={ action.label } type="button" onClick={ action.onClick }>
							{ action.label }
						</button>
					) ) }
				</div>
			);
		}
		if ( isLoading ) {
			return <div>Loading</div>;
		}
		if ( isEmpty ) {
			return <p>{ empty?.description }</p>;
		}
		return children;
	},
	describeError: (
		_error: unknown,
		options: { retryDescription: string; onRetry: () => void }
	) => ( {
		description: options.retryDescription,
		actions: [ { label: 'Retry', onClick: options.onRetry } ],
	} ),
	useWidgetRootContext: () => mockUseRootContext(),
} ) );

const VIEW_QUERY = { context: 'view' };

const videopressMedia = ( overrides: Record< string, unknown > = {} ) => ( {
	id: 42,
	title: { rendered: 'Launch' },
	source_url: 'https://example.com/launch.mp4',
	mime_type: 'video/videopress',
	jetpack_videopress: { guid: 'abc123', is_private: false },
	media_details: { videopress: { poster: 'https://example.com/poster.jpg', finished: true } },
	...overrides,
} );

describe( 'Video player widget', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockPageParams = { post_id: 42 };
		mockGetEntityRecord.mockReturnValue( videopressMedia() );
		mockHasFinishedResolution.mockReturnValue( true );
		mockGetResolutionError.mockReturnValue( null );
	} );

	it( 'requests the video the host names over the page one', () => {
		render( <VideoPlayer attributes={ { reportParams: { post_id: 7 } } } /> );

		expect( mockGetEntityRecord ).toHaveBeenCalledWith( 'postType', 'attachment', 7, VIEW_QUERY );
		expect( mockGetEntityRecord ).not.toHaveBeenCalledWith(
			'postType',
			'attachment',
			42,
			VIEW_QUERY
		);
	} );

	it( 'asks for a video when the page names none, without a request', () => {
		mockPageParams = {};

		render( <VideoPlayer attributes={ {} } /> );

		expect( screen.getByText( 'Open a video to play it here.' ) ).toBeInTheDocument();
		expect( mockGetEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'plays the report video, read with the view context', () => {
		render( <VideoPlayer attributes={ {} } /> );

		expect( mockGetEntityRecord ).toHaveBeenCalledWith( 'postType', 'attachment', 42, VIEW_QUERY );
		expect( screen.getByTitle( 'Video preview' ) ).toHaveAttribute(
			'src',
			expect.stringContaining( 'https://videopress.com/embed/abc123' )
		);
	} );

	it( 'shows the loading state until the attachment resolves', () => {
		mockGetEntityRecord.mockReturnValue( undefined );
		mockHasFinishedResolution.mockReturnValue( false );

		render( <VideoPlayer attributes={ {} } /> );

		expect( screen.getByText( 'Loading' ) ).toBeInTheDocument();
	} );

	it( 'says when the video cannot play yet', () => {
		mockGetEntityRecord.mockReturnValue( {
			id: 42,
			title: { rendered: 'Raw' },
			mime_type: 'video/mp4',
		} );

		render( <VideoPlayer attributes={ {} } /> );

		expect( screen.getByText( "This video isn't ready to play yet." ) ).toBeInTheDocument();
	} );

	it( 'reports a failed conversion as an error without retry', () => {
		mockGetEntityRecord.mockReturnValue(
			videopressMedia( { media_details: { file_statuses: { mp4: 'ERROR' } } } )
		);

		render( <VideoPlayer attributes={ {} } /> );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'Conversion failed. Delete this video and upload it again.'
		);
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
		expect( screen.queryByTitle( 'Video preview' ) ).not.toBeInTheDocument();
	} );

	it( 'offers retry when the request fails, dropping the cached answer', async () => {
		const user = userEvent.setup();
		mockGetEntityRecord.mockReturnValue( undefined );
		mockGetResolutionError.mockReturnValue( new Error( 'offline' ) );

		render( <VideoPlayer attributes={ {} } /> );

		expect(
			screen.getByText( "We couldn't load this video. Please try again in a moment." )
		).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( mockInvalidateResolution ).toHaveBeenCalledWith( 'getEntityRecord', [
			'postType',
			'attachment',
			42,
			VIEW_QUERY,
		] );
	} );
} );
