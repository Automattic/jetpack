import { render, screen } from '@testing-library/react';
import { getManagementPageObject, setup } from '../../../../utils/test-factory';
import { MarkAsShared } from '../../mark-as-shared';

jest.mock( '../../../../hooks/use-user-can-share-connection', () => ( {
	useUserCanShareConnection: jest.fn( () => true ),
} ) );

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
				} }
			/>
		);

		const toggle = screen.getByRole( 'checkbox', { name: 'Mark the connection as shared' } );
		expect( toggle ).toBeDisabled();
	} );
} );
