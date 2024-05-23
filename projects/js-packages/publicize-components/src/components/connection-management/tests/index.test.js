import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import ConnectionManagement from '..';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { useSupportedServices } from '../../services/use-supported-services';

jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );

jest.mock( '../../../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../services/use-supported-services', () => ( {
	useSupportedServices: jest.fn(),
} ) );

const setupMocks = ( {
	connections = [
		{ service_name: 'twitter', connection_id: '1', display_name: 'Twitter', can_disconnect: true },
		{
			service_name: 'facebook',
			connection_id: '2',
			display_name: 'Facebook',
			can_disconnect: true,
		},
	],
} = {} ) => {
	useSelect.mockImplementation( () => {
		return {
			connections,
			keyringResult: {},
			updatingConnections: [],
			deletingConnections: [],
		};
	} );

	useSocialMediaConnections.mockReturnValue( {
		refresh: jest.fn(),
	} );

	useSupportedServices.mockReturnValue( [
		{ ID: 'twitter', name: 'Twitter' },
		{ ID: 'facebook', name: 'Facebook' },
	] );
};

const querySpinner = () => screen.queryByRole( 'presentation', { name: 'Loading spinner' } );
const getAllSpinners = () =>
	screen.getAllByRole( 'presentation', {
		name: 'Loading spinner',
	} );

describe( 'ConnectionManagement', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'No connections', () => {
		beforeEach( () => {
			setupMocks( { connections: [] } );
		} );

		test( 'renders the component with no connections', () => {
			render( <ConnectionManagement /> );
			expect( screen.getByText( 'My Connections' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Add connection' } ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Facebook' ) ).not.toBeInTheDocument();
			expect( querySpinner() ).not.toBeInTheDocument();
		} );
	} );

	describe( 'With connections', () => {
		test( 'renders the spinner without connection name', () => {
			setupMocks( {
				connections: [
					{ service_name: 'twitter', connection_id: '1' },
					{ service_name: 'facebook', connection_id: '2' },
				],
			} );

			render( <ConnectionManagement /> );
			expect( screen.getByText( 'My Connections' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Add connection' } ) ).toBeInTheDocument();
			expect( getAllSpinners() ).toHaveLength( 2 );
		} );

		test( 'renders the component with proper connections', () => {
			setupMocks();

			render( <ConnectionManagement /> );
			expect( screen.getByText( 'My Connections' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Add connection' } ) ).toBeInTheDocument();
			expect( screen.getByText( 'Twitter' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Facebook' ) ).toBeInTheDocument();
			expect( querySpinner() ).not.toBeInTheDocument();
		} );

		describe( 'Connection panel', () => {
			const getFacebookPanelOpenButton = () => {
				return within( screen.getAllByRole( 'listitem' )[ 1 ] ).queryByRole( 'button', {
					name: 'Open panel',
				} );
			};
			const getFacebookPanelCloseButton = () => {
				return within( screen.getAllByRole( 'listitem' )[ 1 ] ).queryByRole( 'button', {
					name: 'Close panel',
				} );
			};

			test( 'connection panel can be opened and closed', async () => {
				setupMocks();
				render( <ConnectionManagement /> );

				expect( getFacebookPanelOpenButton() ).toBeInTheDocument();
				expect( getFacebookPanelCloseButton() ).not.toBeInTheDocument();
				expect( screen.queryByText( 'Disconnect' ) ).not.toBeInTheDocument();

				// Open the panel
				await userEvent.click( getFacebookPanelOpenButton() );
				expect( screen.getByText( 'Disconnect' ) ).toBeInTheDocument();
				expect( getFacebookPanelCloseButton() ).toBeInTheDocument();
				expect( getFacebookPanelOpenButton() ).not.toBeInTheDocument();

				// Close the panel
				await userEvent.click( getFacebookPanelCloseButton() );
				expect( screen.queryByText( 'Disconnect' ) ).not.toBeInTheDocument();
				expect( getFacebookPanelOpenButton() ).toBeInTheDocument();
				expect( getFacebookPanelCloseButton() ).not.toBeInTheDocument();
			} );

			test( 'clicking disconnect should bring up confirmation which can be cancelled', async () => {
				setupMocks();
				render( <ConnectionManagement /> );

				// Open the panel
				await userEvent.click( getFacebookPanelOpenButton() );

				// Disconnect
				await userEvent.click( screen.getByText( 'Disconnect' ) );

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
		} );
	} );
} );
