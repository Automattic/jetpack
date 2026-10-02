import { getRequiredPlan, useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import UploadError from '../uploader-error.jsx';

const mockUseConnectionErrorNotice = jest.fn();
const mockPlaceholderWrapper = jest.fn( ( { instructions, children } ) => (
	<Placeholder instructions={ instructions }>{ children }</Placeholder>
) );
const mockGoToCheckout = jest.fn( event => event.preventDefault() );

jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	default: ( ...args ) => mockUseConnectionErrorNotice( ...args ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getRequiredPlan: jest.fn(),
	useUpgradeFlow: jest.fn(),
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	...jest.requireActual( '@wordpress/i18n' ),
	__: jest.fn( s => s ),
} ) );
jest.mock( '@wordpress/ui', () => ( {
	Link: () => null,
} ) );
jest.mock( '../../../edit', () => ( {
	PlaceholderWrapper: ( ...args ) => mockPlaceholderWrapper( ...args ),
} ) );

const FREE_QUOTA_MESSAGE =
	'You have used your free video. Upgrade to a VideoPress plan to unlock more videos and 1TB of storage.';

const TOKEN_ERROR = { code: 'videopress_no_upload_token', message: 'No token provided' };

const renderError = ( errorData, hasConnectionError ) => {
	mockUseConnectionErrorNotice.mockReturnValue( { hasConnectionError } );
	render( <UploadError errorData={ errorData } onRetry={ () => {} } onCancel={ () => {} } /> );
	return mockPlaceholderWrapper.mock.calls[ 0 ][ 0 ].errorMessage;
};

describe( 'UploadError', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		getRequiredPlan.mockReturnValue( false );
		useUpgradeFlow.mockReturnValue( [
			'https://wordpress.com/checkout/example.com/jetpack_videopress',
			mockGoToCheckout,
			false,
		] );
		__.mockImplementation( s => s );
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

	it( 'offers VideoPress checkout instead of retrying a free-quota failure', async () => {
		const onRetry = jest.fn();
		const onCancel = jest.fn();
		mockUseConnectionErrorNotice.mockReturnValue( { hasConnectionError: false } );
		render(
			<UploadError
				errorData={ { data: { message: FREE_QUOTA_MESSAGE } } }
				onRetry={ onRetry }
				onCancel={ onCancel }
			/>
		);

		const upgrade = screen.getByRole( 'link', { name: 'Upgrade' } );
		expect(
			screen.getByText( FREE_QUOTA_MESSAGE, { selector: '.components-placeholder__instructions' } )
		).toBeInTheDocument();
		expect( mockPlaceholderWrapper.mock.calls[ 0 ][ 0 ].errorMessage ).toBeUndefined();
		expect( upgrade ).toHaveAttribute(
			'href',
			'https://wordpress.com/checkout/example.com/jetpack_videopress'
		);
		expect( useUpgradeFlow ).toHaveBeenCalledWith( 'jetpack_videopress' );
		expect(
			screen.getByText( FREE_QUOTA_MESSAGE, { selector: '[aria-live="polite"]' } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Try again' } ) ).not.toBeInTheDocument();
		await userEvent.click( upgrade );
		expect( mockGoToCheckout ).toHaveBeenCalledTimes( 1 );
		expect( onRetry ).not.toHaveBeenCalled();
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( onCancel ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'recognizes a translated free-quota message', () => {
		const translatedMessage = 'Has usado tu vídeo gratuito.';
		__.mockImplementation( s => ( s === FREE_QUOTA_MESSAGE ? translatedMessage : s ) );

		renderError( { data: { message: translatedMessage } }, false );
		expect(
			screen.getByText( translatedMessage, { selector: '.components-placeholder__instructions' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'recognizes the English server message with a translated editor', () => {
		__.mockImplementation( s => ( s === FREE_QUOTA_MESSAGE ? 'Has usado tu vídeo gratuito.' : s ) );
		renderError( { data: { message: FREE_QUOTA_MESSAGE } }, false );
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'uses the required WordPress.com plan for a plan-restricted MIME error', () => {
		getRequiredPlan.mockReturnValue( 'business' );
		renderError( { data: { message: 'Invalid Mime' } }, false );

		expect( useUpgradeFlow ).toHaveBeenCalledWith( 'business' );
		expect(
			screen.getByText( 'Your plan does not include video uploads. Upgrade to upload videos.', {
				selector: '.components-placeholder__instructions',
			} )
		).toBeInTheDocument();
		expect( mockPlaceholderWrapper.mock.calls[ 0 ][ 0 ].errorMessage ).toBeUndefined();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Try again' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		'You have used your space quota. Please delete files before uploading.',
		'Invalid Mime',
		'File too large',
	] )( 'keeps retry available without an upsell for %s', async message => {
		const onRetry = jest.fn();
		mockUseConnectionErrorNotice.mockReturnValue( { hasConnectionError: false } );
		render(
			<UploadError errorData={ { data: { message } } } onRetry={ onRetry } onCancel={ jest.fn() } />
		);

		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
		expect( useUpgradeFlow ).not.toHaveBeenCalled();
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
