import { currentUserCan } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import OverviewTab from '..';

// Avoid pulling the real social store (and its @wordpress/editor imports)
// into the test.
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

// Stub the heavy children so this test isolates OverviewTab's gating — what
// renders for admins vs non-admins.
jest.mock( '../traffic-chart-card', () => () => <div data-testid="traffic-chart-card" /> );
jest.mock( '../../connection-management', () => () => <div data-testid="connection-management" /> );
jest.mock( '../../manage-connections-modal', () => ( {
	ThemedConnectionsModal: () => <div data-testid="connections-modal" />,
} ) );

jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	default: () => ( { hasConnectionError: false } ),
	ConnectionError: () => <div data-testid="connection-error" />,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: () => ( { openConnectionsModal: jest.fn() } ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	currentUserCan: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.Mock;
const mockCurrentUserCan = currentUserCan as jest.Mock;

/**
 * Configure the Overview tab's inputs.
 *
 * @param overrides                - State overrides.
 * @param overrides.hasConnections - Whether the site has any social connections.
 * @param overrides.manageOptions  - Whether the current user has manage_options.
 */
function setup( { hasConnections = true, manageOptions = true } = {} ) {
	mockUseSelect.mockImplementation( ( mapSelect: ( select: unknown ) => unknown ) =>
		mapSelect( () => ( {
			getConnections: () => ( hasConnections ? [ { connection_id: '1' } ] : [] ),
		} ) )
	);
	mockCurrentUserCan.mockImplementation( cap =>
		cap === 'manage_options' ? manageOptions : false
	);
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'OverviewTab', () => {
	it( 'shows the traffic chart to admins that have connections', () => {
		setup( { hasConnections: true, manageOptions: true } );

		render( <OverviewTab /> );

		expect( screen.getByTestId( 'traffic-chart-card' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'connection-management' ) ).toBeInTheDocument();
	} );

	it( 'hides the traffic chart from non-admins but keeps connection management', () => {
		setup( { hasConnections: true, manageOptions: false } );

		render( <OverviewTab /> );

		expect( screen.queryByTestId( 'traffic-chart-card' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'connection-management' ) ).toBeInTheDocument();
	} );
} );
