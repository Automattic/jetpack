import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setup } from '../../../utils/test-factory';
import { ConfirmationForm } from '../confirmation-form';

describe( 'ConfirmationForm', () => {
	let stubCreateConnection;

	beforeEach( () => {
		jest.clearAllMocks();
		( { stubCreateConnection } = setup( {
			connections: [
				{
					service_name: 'facebook',
					external_id: 'additional-1',
					external_name: 'Test Account',
					external_profile_picture: 'https://example.com/profile.jpg',
				},
			],
		} ) );
	} );

	const keyringResult = {
		ID: 'service-1',
		service: 'facebook',
		external_display: 'Test Account',
		external_ID: 'test-account-1',
		external_profile_picture: 'https://example.com/profile.jpg',
		additional_external_users: [
			{
				external_name: 'Additional User 1',
				external_ID: 'additional-1',
				external_profile_picture: 'https://example.com/additional1.jpg',
			},
			{
				external_name: 'Additional User 2',
				external_ID: 'additional-2',
				external_profile_picture: 'https://example.com/additional2.jpg',
			},
		],
	};

	const keyringResult2 = {
		ID: 23456789,
		service: 'linkedin',
		external_ID: 'abcd',
		external_name: 'social-testino',
		external_display: 'Social Testino',
		additional_external_users: [
			{
				external_ID: '123456789',
				external_name: 'JP Social Test Company',
			},
			{
				external_ID: '987654321',
				external_name: 'Cats Company',
			},
		],
	};

	const renderComponent = ( props = {} ) => {
		return render(
			<ConfirmationForm keyringResult={ keyringResult } onComplete={ jest.fn() } { ...props } />
		);
	};

	test( 'renders the form with account options', () => {
		renderComponent();

		expect( screen.getByText( /Select the account you'd like to connect/ ) ).toBeInTheDocument();
		// Facebook should not show the main user account
		expect( screen.queryByText( 'Test Account' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Additional User 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Additional User 2' ) ).toBeInTheDocument();
	} );

	test( 'renders the form with main and additional account options', () => {
		render( <ConfirmationForm keyringResult={ keyringResult2 } onComplete={ jest.fn() } /> );

		expect( screen.getByText( /Select the account you'd like to connect/ ) ).toBeInTheDocument();
		// LinkedIn should show the main user account
		expect( screen.getByText( 'Social Testino' ) ).toBeInTheDocument();
		expect( screen.getByText( 'JP Social Test Company' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Cats Company' ) ).toBeInTheDocument();
	} );

	test( 'submits the form successfully', async () => {
		renderComponent();

		await userEvent.click( screen.getByLabelText( 'Additional User 2' ) );
		await userEvent.click( screen.getByText( 'Confirm' ) );

		await waitFor( () =>
			expect( stubCreateConnection ).toHaveBeenCalledWith(
				{
					external_user_ID: 'additional-2',
					keyring_connection_ID: 'service-1',
					shared: undefined,
				},
				{
					display_name: 'Additional User 2',
					profile_picture: 'https://example.com/additional2.jpg',
					service_name: 'facebook',
					external_id: 'additional-2',
				}
			)
		);
	} );

	test( 'marks connection as shared by default', async () => {
		renderComponent( { canMarkAsShared: true } );

		await userEvent.click( screen.getByText( 'Confirm' ) );

		await waitFor( () =>
			expect( stubCreateConnection ).toHaveBeenCalledWith(
				{
					external_user_ID: 'additional-2',
					keyring_connection_ID: 'service-1',
					shared: true,
				},
				{
					display_name: 'Additional User 2',
					profile_picture: 'https://example.com/additional2.jpg',
					service_name: 'facebook',
					external_id: 'additional-2',
				}
			)
		);
	} );

	test( 'does not mark connection as shared when unchecked', async () => {
		renderComponent( { canMarkAsShared: true } );

		// Uncheck the shared checkbox (it's checked by default)
		await userEvent.click( screen.getByLabelText( 'Mark the connection as shared' ) );
		await userEvent.click( screen.getByText( 'Confirm' ) );

		await waitFor( () =>
			expect( stubCreateConnection ).toHaveBeenCalledWith(
				{
					external_user_ID: 'additional-2',
					keyring_connection_ID: 'service-1',
					shared: undefined,
				},
				{
					display_name: 'Additional User 2',
					profile_picture: 'https://example.com/additional2.jpg',
					service_name: 'facebook',
					external_id: 'additional-2',
				}
			)
		);
	} );

	test( 'handles cancel button click', async () => {
		const onCompleteMock = jest.fn();
		renderComponent( { onComplete: onCompleteMock } );

		await userEvent.click( screen.getByText( 'Cancel' ) );

		expect( onCompleteMock ).toHaveBeenCalled();
	} );

	test( 'displays already connected accounts', () => {
		renderComponent();

		expect( screen.getByText( 'Already connected' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Additional User 1' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Additional User 1' ) ).not.toBeInTheDocument(); // Should not be selectable
	} );

	describe( 'empty account list', () => {
		const emptyKeyringResult = {
			ID: 987654,
			service: 'instagram-business',
			external_ID: 'ig-user-1',
			external_name: 'IG User',
			external_display: 'IG User',
			additional_external_users: [],
		};

		const renderEmpty = reason =>
			render(
				<ConfirmationForm
					keyringResult={ {
						...emptyKeyringResult,
						additional_external_users_empty_reason: reason,
					} }
					onComplete={ jest.fn() }
				/>
			);

		beforeEach( () => {
			setup( { connections: [] } );
		} );

		test.each( [
			[
				'no_instagram_account',
				/None of your Facebook Pages has an Instagram professional account linked/,
			],
			[ 'no_pages', /You don't manage any Facebook Pages/ ],
			[ 'page_access_denied', /We couldn't access your Facebook Pages/ ],
			[ 'account_check_failed', /We couldn't check your Instagram account just now/ ],
			[ 'service_error', /Facebook didn't respond/ ],
		] )( 'explains the %s reason', ( reason, message ) => {
			renderEmpty( reason );

			expect( screen.getByText( message ) ).toBeInTheDocument();
		} );

		test.each( [
			[ 'null', null ],
			[ 'absent', undefined ],
			[ 'unknown', 'some_future_reason' ],
		] )( 'falls back to the generic message for a %s reason', ( _label, reason ) => {
			renderEmpty( reason );

			expect( screen.getByText( 'No accounts/pages found.' ) ).toBeInTheDocument();
		} );

		test( 'keeps the "no more accounts" message when all accounts are already connected', () => {
			setup( {
				connections: [ { service_name: 'instagram-business', external_id: 'ig-account-1' } ],
			} );

			render(
				<ConfirmationForm
					keyringResult={ {
						...emptyKeyringResult,
						additional_external_users: [
							{
								external_ID: 'ig-account-1',
								external_name: 'IG Account 1',
								external_profile_picture: '',
							},
						],
						additional_external_users_empty_reason: 'no_instagram_account',
					} }
					onComplete={ jest.fn() }
				/>
			);

			expect( screen.getByText( 'No more accounts/pages found.' ) ).toBeInTheDocument();
		} );
	} );
} );
