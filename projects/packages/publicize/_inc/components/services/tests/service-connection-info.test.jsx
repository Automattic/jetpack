import { render, screen } from '@testing-library/react';
import { setup } from '../../../utils/test-factory';
import { ServiceConnectionInfo } from '../service-connection-info';

jest.mock( '../../connection-management/connection-name', () => ( {
	ConnectionName: ( { connection } ) => <div>{ connection.display_name }</div>,
} ) );
jest.mock( '../../connection-management/connection-status', () => ( {
	ConnectionStatus: ( { connection } ) => <div>Status: { connection.status }</div>,
} ) );
jest.mock( '../../connection-management/connection-template', () => ( {
	ConnectionTemplateEditor: () => null,
} ) );
jest.mock( '../../connection-management/disconnect', () => ( {
	Disconnect: ( { connection } ) => <button>Disconnect { connection.display_name }</button>,
} ) );
jest.mock( '../../connection-management/mark-as-shared', () => ( {
	MarkAsShared: () => <button>Mark as Shared</button>,
} ) );

describe( 'ServiceConnectionInfo', () => {
	const connection = {
		profile_picture: 'https://example.com/profile.jpg',
		display_name: 'Example User',
		status: 'connected',
	};

	const renderComponent = ( connOverrides = {}, serviceOverrides = {}, props = {} ) => {
		setup( { canUserManageConnection: props.canUserManageConnection ?? true } );
		render(
			<ServiceConnectionInfo
				connection={ { ...connection, ...connOverrides } }
				service={ { ...serviceOverrides } }
				canMarkAsShared={ props.canMarkAsShared ?? false }
			/>
		);
	};

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the profile picture and connection name', () => {
		renderComponent();

		const profilePic = screen.getByAltText( 'Example User' );
		expect( profilePic ).toHaveAttribute( 'src', 'https://example.com/profile.jpg' );
		expect( screen.getByText( 'Example User' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Disconnect Example User' ) ).toBeInTheDocument();
	} );

	test( 'renders the mark-as-shared toggle with the info IconButton', () => {
		renderComponent( {}, {}, { canMarkAsShared: true } );

		expect( screen.getByText( 'Mark as Shared' ) ).toBeInTheDocument();
		// The IconButton exposes its help text as an accessible name.
		expect(
			screen.getByRole( 'button', { name: /available to all administrators/i } )
		).toBeInTheDocument();
	} );

	test( 'renders the connection status when broken and manageable', () => {
		renderComponent( { status: 'broken' } );

		expect( screen.getByText( 'Status: broken' ) ).toBeInTheDocument();
	} );

	test( 'tells non-admins the connection was added by a site administrator', () => {
		renderComponent( {}, {}, { canUserManageConnection: false } );

		expect(
			screen.getByText( 'This connection is added by a site administrator.' )
		).toBeInTheDocument();
	} );

	test( 'does not render the mark-as-shared help text without the action', () => {
		renderComponent();

		expect(
			screen.queryByText(
				'If enabled, the connection will be available to all administrators, editors, and authors.'
			)
		).not.toBeInTheDocument();
	} );
} );
