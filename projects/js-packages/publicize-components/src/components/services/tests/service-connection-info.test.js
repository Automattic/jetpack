import { render, screen } from '@testing-library/react';
import { ServiceConnectionInfo } from '../service-connection-info';

jest.mock( '../../connection-management/connection-name', () => ( {
	ConnectionName: ( { connection } ) => <div>{ connection.display_name }</div>,
} ) );
jest.mock( '../../connection-management/connection-status', () => ( {
	ConnectionStatus: ( { connection } ) => <div>Status: { connection.status }</div>,
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
		can_disconnect: true,
	};

	const service = {
		icon: () => <svg aria-label="test-svg"></svg>,
	};

	const renderComponent = ( connOverrides = {}, serviceOverrides = {}, props = {} ) => {
		render(
			<ServiceConnectionInfo
				connection={ { ...connection, ...connOverrides } }
				service={ { ...service, ...serviceOverrides } }
				{ ...props }
			/>
		);
	};

	test( 'renders profile picture if available', () => {
		renderComponent();
		const profilePic = screen.getByAltText( 'Example User' );
		expect( profilePic ).toBeInTheDocument();
		expect( profilePic ).toHaveAttribute( 'src', 'https://example.com/profile.jpg' );
	} );

	test( 'renders service icon if profile picture is not available', () => {
		renderComponent( { profile_picture: null } );
		const serviceIcon = screen.getByLabelText( 'test-svg' );
		expect( serviceIcon ).toBeInTheDocument();
	} );

	test( 'displays ConnectionName', () => {
		renderComponent();
		expect( screen.getByText( 'Example User' ) ).toBeInTheDocument();
	} );

	test( 'displays ConnectionStatus if status is broken', () => {
		renderComponent( { status: 'broken' } );
		expect( screen.getByText( 'Status: broken' ) ).toBeInTheDocument();
	} );

	test( 'displays MarkAsShared button if connection can be disconnected', () => {
		renderComponent( {}, {}, { isAdmin: true } );
		expect( screen.getByText( 'Mark as Shared' ) ).toBeInTheDocument();
	} );

	test( 'displays disconnect button', () => {
		renderComponent();
		expect( screen.getByText( 'Disconnect Example User' ) ).toBeInTheDocument();
	} );

	test( 'displays description if connection cannot be disconnected', () => {
		renderComponent( { can_disconnect: false } );
		expect(
			screen.getByText( 'This connection is added by a site administrator.' )
		).toBeInTheDocument();
	} );

	test( 'does not display tooltip information without action', async () => {
		renderComponent();

		expect(
			screen.queryByText(
				'If enabled, the connection will be available to all administrators, editors, and authors.'
			)
		).not.toBeInTheDocument();
	} );
} );
