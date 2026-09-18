import { render } from '@testing-library/react';
import UploadError from '../uploader-error.jsx';

const mockUseConnectionErrorNotice = jest.fn();
// The wrapper is where the message lands, so capturing its props is the only
// way to read what getErrorMessage() decided.
const mockPlaceholderWrapper = jest.fn( () => null );

jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	default: ( ...args ) => mockUseConnectionErrorNotice( ...args ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getRequiredPlan: () => null,
	getSiteFragment: () => 'example.com',
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: () => null,
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: s => s,
} ) );
jest.mock( '@wordpress/ui', () => ( {
	Link: () => null,
} ) );
jest.mock( '../../../edit', () => ( {
	PlaceholderWrapper: ( ...args ) => mockPlaceholderWrapper( ...args ),
} ) );

const TOKEN_ERROR = { code: 'videopress_no_upload_token', message: 'No token provided' };

const renderError = ( errorData, hasConnectionError ) => {
	mockUseConnectionErrorNotice.mockReturnValue( { hasConnectionError } );
	render( <UploadError errorData={ errorData } onRetry={ () => {} } onCancel={ () => {} } /> );
	return mockPlaceholderWrapper.mock.calls[ 0 ][ 0 ].errorMessage;
};

describe( 'UploadError', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'names the connection when a token failure lands on a site reporting one', () => {
		expect( renderError( TOKEN_ERROR, true ) ).toBe(
			'Failed to upload your video. Check your Jetpack connection and try again.'
		);
	} );

	it( 'stays generic for a token failure on a site reporting no connection error', () => {
		// VideoPress switched off, a lapsed plan and a failed capability check all
		// reach here with this code, and none of them are connection problems.
		expect( renderError( TOKEN_ERROR, false ) ).toBe(
			'Failed to upload your video. Please try again.'
		);
	} );

	it( 'does not blame the connection for an unrelated failure on a broken site', () => {
		expect( renderError( { data: { message: 'File too large' } }, true ) ).toBe( 'File too large' );
	} );

	it( 'renders nothing to say when there is no error data', () => {
		expect( renderError( null, false ) ).toBe( '' );
	} );
} );
