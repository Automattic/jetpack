import { render, screen } from '@testing-library/react';
import { ConnectionsToggleList } from '..';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { useConnectionState } from '../../form/use-connection-state';

jest.mock( '../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../form/use-connection-state', () => ( {
	useConnectionState: jest.fn(),
} ) );

const baseConnections = [
	{
		connection_id: 'x-1',
		service_name: 'x',
		display_name: 'X account',
		profile_picture: '',
		enabled: true,
	},
	{
		connection_id: 'tumblr-1',
		service_name: 'tumblr',
		display_name: 'Tumblr account',
		profile_picture: '',
		enabled: true,
	},
];

describe( 'ConnectionsToggleList', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		( useSocialMediaConnections as jest.Mock ).mockReturnValue( {
			connections: baseConnections,
		} );
	} );

	it( 'shows quota-reached accessible text and blocks checked state for quota-blocked X', () => {
		( useConnectionState as jest.Mock ).mockReturnValue( {
			canBeTurnedOn: ( connection: { service_name: string } ) => connection.service_name !== 'x',
			shouldBeDisabled: ( connection: { service_name: string } ) => connection.service_name === 'x',
			getDisabledReason: ( connection: { service_name: string } ) =>
				connection.service_name === 'x' ? 'quota_exceeded' : undefined,
		} );

		render( <ConnectionsToggleList onClickItem={ jest.fn() } /> );

		expect( screen.getByText( 'Sharing limit reached' ) ).toBeInTheDocument();

		const [ xToggle ] = screen.getAllByRole( 'switch' );
		expect( xToggle ).not.toBeChecked();
		expect( xToggle ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'does not show quota-reached text when no connection is quota blocked', () => {
		( useConnectionState as jest.Mock ).mockReturnValue( {
			canBeTurnedOn: () => true,
			shouldBeDisabled: () => false,
			getDisabledReason: () => undefined,
		} );

		render( <ConnectionsToggleList onClickItem={ jest.fn() } /> );

		expect( screen.queryByText( 'Sharing limit reached' ) ).not.toBeInTheDocument();
	} );
} );
