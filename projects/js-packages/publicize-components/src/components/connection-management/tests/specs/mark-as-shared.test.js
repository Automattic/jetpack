import { render, screen } from '@testing-library/react';
import { getManagementPageObject, setup } from '../../../../utils/test-factory';
import { MarkAsShared } from '../../mark-as-shared';

describe( 'Marking a connection as shared', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'toggling the checkbox should mark a connection as shared', async () => {
		const { stubUpdateConnectionById } = setup();
		const management = getManagementPageObject();

		const facebookPanel = management.connectionPanels[ 0 ];
		await facebookPanel.open();

		expect( facebookPanel.markAsSharedToggle ).toBeEnabled();
		await facebookPanel.toggleMarkAsShared();
		expect( stubUpdateConnectionById ).toHaveBeenCalledWith( '2', { shared: true } );
	} );

	test( 'toggle is disabled while updating', async () => {
		setup( { getUpdatingConnections: [ '2' ] } );
		render(
			<MarkAsShared
				connection={ {
					service_name: 'facebook',
					connection_id: '2',
					display_name: 'Facebook',
					can_disconnect: true,
				} }
			/>
		);

		const toggle = screen.getByRole( 'checkbox', { name: 'Mark the connection as shared' } );
		expect( toggle ).toBeDisabled();
	} );
} );
