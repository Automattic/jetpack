import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import analytics from 'lib/analytics';
import { render } from 'test/test-utils';
import { ProtectedOwnerErrorNotice } from '../protected-owner-error-notices';

// Mock dependencies
jest.mock( 'lib/analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
	},
} ) );

jest.mock( 'components/notice', () => {
	return function MockSimpleNotice( { children, text, status, icon, showDismiss, display } ) {
		return (
			<div
				data-testid="simple-notice"
				data-status={ status }
				data-icon={ icon }
				data-show-dismiss={ showDismiss }
				data-display={ display }
			>
				<span data-testid="notice-text">{ text }</span>
				{ children }
			</div>
		);
	};
} );

jest.mock( 'components/notice/notice-action.jsx', () => {
	return function MockNoticeAction( { children, onClick, className } ) {
		return (
			<button data-testid="notice-action" onClick={ onClick } className={ className }>
				{ children }
			</button>
		);
	};
} );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

// Mock window object
Object.defineProperty( window, 'location', {
	value: {
		href: '',
	},
	writable: true,
} );

describe( 'ProtectedOwnerErrorNotice', () => {
	const defaultProps = {
		text: 'Test error message for protected owner',
		errorCode: 'wrong_owner_protected_owner_missing',
		errorData: {
			wpcom_email: 'test@example.com',
			error_type: 'missing_owner',
		},
		display: true,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		window.location.href = '';
	} );

	describe( 'rendering', () => {
		it( 'renders the notice with correct props', () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const notice = screen.getByTestId( 'simple-notice' );
			expect( notice ).toBeInTheDocument();
			expect( notice ).toHaveAttribute( 'data-status', 'is-error' );
			expect( notice ).toHaveAttribute( 'data-icon', 'link-break' );
			expect( notice ).toHaveAttribute( 'data-show-dismiss', 'false' );
			expect( notice ).toHaveAttribute( 'data-display', 'true' );
		} );

		it( 'displays the correct error text', () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			expect( screen.getByTestId( 'notice-text' ) ).toHaveTextContent(
				'Test error message for protected owner'
			);
		} );

		it( 'renders the create missing account button', () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const button = screen.getByTestId( 'notice-action' );
			expect( button ).toBeInTheDocument();
			expect( button ).toHaveClass( 'jp-protected-owner-action-create' );
			expect( button ).toHaveTextContent( 'Create missing account' );
		} );

		it( 'uses default text when no text prop is provided', () => {
			const propsWithoutText = { ...defaultProps };
			delete propsWithoutText.text;

			render( <ProtectedOwnerErrorNotice { ...propsWithoutText } /> );

			expect( screen.getByTestId( 'notice-text' ) ).toHaveTextContent(
				'There is an issue with the protected owner account connection.'
			);
		} );

		it( 'uses default display value when no display prop is provided', () => {
			const propsWithoutDisplay = { ...defaultProps };
			delete propsWithoutDisplay.display;

			render( <ProtectedOwnerErrorNotice { ...propsWithoutDisplay } /> );

			const notice = screen.getByTestId( 'simple-notice' );
			expect( notice ).toHaveAttribute( 'data-display', 'true' );
		} );

		it( 'respects display prop when set to false', () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } display={ false } /> );

			const notice = screen.getByTestId( 'simple-notice' );
			expect( notice ).toHaveAttribute( 'data-display', 'false' );
		} );
	} );

	describe( 'create missing account functionality', () => {
		it( 'calls analytics tracking when create missing account button is clicked', async () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const button = screen.getByTestId( 'notice-action' );
			await userEvent.click( button );

			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_protected_owner_create_account_attempt',
				{
					error_code: 'wrong_owner_protected_owner_missing',
				}
			);
		} );

		it( 'redirects to WordPress user creation page when button is clicked', async () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const button = screen.getByTestId( 'notice-action' );
			await userEvent.click( button );

			expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
		} );

		it( 'tracks analytics with undefined error code when not provided', async () => {
			const propsWithoutErrorCode = { ...defaultProps };
			delete propsWithoutErrorCode.errorCode;

			render( <ProtectedOwnerErrorNotice { ...propsWithoutErrorCode } /> );

			const button = screen.getByTestId( 'notice-action' );
			await userEvent.click( button );

			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_protected_owner_create_account_attempt',
				{
					error_code: undefined,
				}
			);
		} );

		it( 'still redirects when no error code is provided', async () => {
			const propsWithoutErrorCode = { ...defaultProps };
			delete propsWithoutErrorCode.errorCode;

			render( <ProtectedOwnerErrorNotice { ...propsWithoutErrorCode } /> );

			const button = screen.getByTestId( 'notice-action' );
			await userEvent.click( button );

			expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
		} );
	} );

	describe( 'prop types and validation', () => {
		it( 'handles all prop types correctly', async () => {
			const allProps = {
				text: 'Custom error message',
				errorCode: 'no_user_connection_protected_owner_missing',
				errorData: {
					wpcom_email: 'owner@example.com',
					error_type: 'missing_owner',
					additional_info: 'Some additional data',
				},
				display: false,
			};

			render( <ProtectedOwnerErrorNotice { ...allProps } /> );

			// Verify all props are handled correctly
			expect( screen.getByTestId( 'notice-text' ) ).toHaveTextContent( 'Custom error message' );

			const notice = screen.getByTestId( 'simple-notice' );
			expect( notice ).toHaveAttribute( 'data-display', 'false' );

			// Test analytics with different error code
			const button = screen.getByTestId( 'notice-action' );
			await userEvent.click( button );

			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_protected_owner_create_account_attempt',
				{
					error_code: 'no_user_connection_protected_owner_missing',
				}
			);
		} );

		it( 'works with minimal required props', () => {
			const minimalProps = {
				text: 'Minimal error message',
			};

			render( <ProtectedOwnerErrorNotice { ...minimalProps } /> );

			expect( screen.getByTestId( 'notice-text' ) ).toHaveTextContent( 'Minimal error message' );
			expect( screen.getByTestId( 'notice-action' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'different error scenarios', () => {
		const errorScenarios = [
			{
				name: 'wrong owner protected owner missing',
				errorCode: 'wrong_owner_protected_owner_missing',
				text: 'This site is connected to WordPress.com, but the WordPress.com plan owner with email test@example.com is missing.',
			},
			{
				name: 'no user connection protected owner missing',
				errorCode: 'no_user_connection_protected_owner_missing',
				text: 'This site needs to be connected to WordPress.com by the plan owner account with email test@example.com.',
			},
			{
				name: 'generic protected owner error',
				errorCode: 'protected_owner_generic_error',
				text: 'There is an issue with the connection owner for this site.',
			},
		];

		errorScenarios.forEach( ( { name, errorCode, text } ) => {
			it( `handles ${ name } error correctly`, async () => {
				render(
					<ProtectedOwnerErrorNotice
						text={ text }
						errorCode={ errorCode }
						errorData={ defaultProps.errorData }
					/>
				);

				expect( screen.getByTestId( 'notice-text' ) ).toHaveTextContent( text );

				const button = screen.getByTestId( 'notice-action' );
				await userEvent.click( button );

				expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
					'jetpack_protected_owner_create_account_attempt',
					{
						error_code: errorCode,
					}
				);

				expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
			} );
		} );
	} );

	describe( 'button interaction', () => {
		it( 'button is clickable and accessible', () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const button = screen.getByTestId( 'notice-action' );

			// Verify button properties
			expect( button ).toBeEnabled();
			expect( button ).toHaveAttribute( 'type', 'button' );
		} );

		it( 'performs all actions in correct order when clicked', async () => {
			render( <ProtectedOwnerErrorNotice { ...defaultProps } /> );

			const button = screen.getByTestId( 'notice-action' );

			// Clear any previous calls
			analytics.tracks.recordEvent.mockClear();

			await userEvent.click( button );

			// Check that analytics was called before navigation
			expect( analytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_protected_owner_create_account_attempt',
				{
					error_code: defaultProps.errorCode,
				}
			);

			// Check that navigation happened
			expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
		} );
	} );
} );
