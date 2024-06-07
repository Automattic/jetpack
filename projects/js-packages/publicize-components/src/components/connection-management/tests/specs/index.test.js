import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getManagementPageObject, setup } from '../../../../utils/test-factory';

describe( 'ConnectionManagement', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'No connections', () => {
		test( 'renders the component with no connections', () => {
			setup( { connections: [] } );
			const management = getManagementPageObject();

			expect( management.header ).not.toBeInTheDocument();
			expect( management.addConnectionButton ).toBeInTheDocument();
			expect( management.getConnectionByName( 'Facebook' ) ).not.toBeInTheDocument();
			expect( management.spinners ).toHaveLength( 0 );
		} );
	} );

	describe( 'With connections', () => {
		test( 'renders the component with proper connections', () => {
			setup();
			const management = getManagementPageObject();

			expect( management.header ).toBeInTheDocument();
			expect( management.addConnectionButton ).toBeInTheDocument();
			expect( management.getConnectionByName( 'Twitter' ) ).toBeInTheDocument();
			expect( management.getConnectionByName( 'Facebook' ) ).toBeInTheDocument();
			expect( management.spinners ).toHaveLength( 0 );
		} );

		describe( 'Connection panel', () => {
			test( 'connection panel can be opened and closed', async () => {
				setup();
				const management = getManagementPageObject();

				const twitterPanel = management.connectionPanels[ 0 ];
				const facebookPanel = management.connectionPanels[ 1 ];

				expect( facebookPanel.isOpen() ).toBeFalsy();
				expect( twitterPanel.isOpen() ).toBeFalsy();
				expect( facebookPanel.disconnectButton ).not.toBeInTheDocument();

				// Open the panel
				await facebookPanel.open();
				expect( facebookPanel.disconnectButton ).toBeInTheDocument();
				expect( facebookPanel.isOpen() ).toBeTruthy();
				expect( twitterPanel.isOpen() ).toBeFalsy();

				// Close the panel
				await facebookPanel.close();
				expect( facebookPanel.disconnectButton ).not.toBeInTheDocument();
				expect( facebookPanel.isOpen() ).toBeFalsy();
			} );

			test( 'clicking disconnect should bring up confirmation which can be cancelled', async () => {
				setup();
				const management = getManagementPageObject();

				const facebookPanel = management.connectionPanels[ 1 ];

				// Open the panel
				await facebookPanel.open();

				// Disconnect
				await facebookPanel.disconnect();

				const confirmationModal = screen.getByRole( 'dialog' );
				expect(
					within( confirmationModal ).getByText( /Are you sure you want to disconnect/ )
				).toBeInTheDocument();

				// Cancel
				await userEvent.click(
					within( confirmationModal ).getByRole( 'button', { name: 'Cancel' } )
				);
				expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
				expect( screen.getByText( 'Disconnect' ) ).toBeInTheDocument();
			} );

			test( 'mark as shared component is visible if user has permission', async () => {
				setup();
				const management = getManagementPageObject();

				const facebookPanel = management.connectionPanels[ 1 ];
				expect( facebookPanel.markAsSharedToggle ).not.toBeInTheDocument();

				await facebookPanel.open();
				expect( facebookPanel.markAsSharedToggle ).toBeInTheDocument();
			} );
		} );
	} );
} );
