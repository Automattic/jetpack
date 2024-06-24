import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setup } from '../../../utils/test-factory';
import { useSupportedServices } from '../../services/use-supported-services';
import { ConfirmationForm } from '../confirmation-form';

jest.mock( '../../services/use-supported-services', () => ( {
	useSupportedServices: jest.fn(),
} ) );

describe( 'ConfirmationForm', () => {
	let stubCreateConnection;

	beforeEach( () => {
		jest.clearAllMocks();
		( { stubCreateConnection } = setup( {
			connections: [
				{
					service_name: 'service-1',
					external_id: 'test-account-1',
					external_name: 'Test Account',
					external_profile_picture: 'https://example.com/profile.jpg',
				},
			],
		} ) );

		useSupportedServices.mockReturnValue( [
			{ ID: 'service-1', external_users_only: false, multiple_external_user_ID_support: true },
		] );
	} );

	const keyringResult = {
		ID: 'service-1',
		service: 'service-1',
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

	const renderComponent = ( props = {} ) => {
		return render(
			<ConfirmationForm keyringResult={ keyringResult } onComplete={ jest.fn() } { ...props } />
		);
	};

	test( 'renders the form with account options', () => {
		renderComponent();

		expect( screen.getByText( /Select the account you'd like to connect/ ) ).toBeInTheDocument();
		expect( screen.getByText( 'Test Account' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Additional User 1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Additional User 2' ) ).toBeInTheDocument();
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
					service_name: 'service-1',
				}
			)
		);
	} );

	test( 'marks connection as shared', async () => {
		renderComponent( { isAdmin: true } );

		await userEvent.click( screen.getByLabelText( 'Mark the connection as shared' ) );
		await userEvent.click( screen.getByText( 'Confirm' ) );

		await waitFor( () =>
			expect( stubCreateConnection ).toHaveBeenCalledWith(
				{
					external_user_ID: 'additional-1',
					keyring_connection_ID: 'service-1',
					shared: true,
				},
				{
					display_name: 'Additional User 1',
					profile_picture: 'https://example.com/additional1.jpg',
					service_name: 'service-1',
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
		expect( screen.getByText( 'Test Account' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Test Account' ) ).not.toBeInTheDocument(); // Should not be selectable
	} );
} );
