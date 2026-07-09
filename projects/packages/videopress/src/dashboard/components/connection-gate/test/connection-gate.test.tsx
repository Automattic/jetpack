import useConnection from '@automattic/jetpack-connection/use-connection';
import { render, screen } from '@testing-library/react';
import ConnectionGate from '../index';

jest.mock( '@automattic/jetpack-connection/use-connection', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Stub the two connection screens so these tests assert only the gate's
// branching, not the screens' internals (the pricing table and its hooks).
jest.mock( '../pricing-upsell', () => ( {
	__esModule: true,
	default: () => <div>Pricing upsell</div>,
} ) );
jest.mock( '../connect-screen', () => ( {
	__esModule: true,
	default: () => <div>Connect screen</div>,
} ) );

const mockUseConnection = useConnection as jest.Mock;

const connected = {
	handleRegisterSite: jest.fn(),
	handleConnectUser: jest.fn(),
	siteIsRegistering: false,
	userIsConnecting: false,
	isRegistered: true,
	isUserConnected: true,
	hasConnectedOwner: true,
};

const setPricing = ( pricing: unknown ) => {
	( window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE = {
		pricing,
	};
};

const DashboardContent = () => <div>Dashboard content</div>;

const renderGate = () =>
	render(
		<ConnectionGate>
			<DashboardContent />
		</ConnectionGate>
	);

describe( 'ConnectionGate', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setPricing( undefined );
	} );

	it( 'renders the dashboard when the site and user are fully connected', () => {
		mockUseConnection.mockReturnValue( connected );

		renderGate();

		expect( screen.getByText( 'Dashboard content' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Pricing upsell' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Connect screen' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the pricing upsell when the site is not registered and pricing data is present', () => {
		setPricing( { title: 'VideoPress', features: [], yearly: {} } );
		mockUseConnection.mockReturnValue( { ...connected, isRegistered: false } );

		renderGate();

		expect( screen.queryByText( 'Dashboard content' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Pricing upsell' ) ).toBeInTheDocument();
	} );

	it( 'falls back to the connect screen when not registered but pricing data is absent', () => {
		mockUseConnection.mockReturnValue( { ...connected, isRegistered: false } );

		renderGate();

		expect( screen.getByText( 'Connect screen' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Pricing upsell' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'there is no connected owner', { hasConnectedOwner: false } ],
		[ 'the current user is not connected', { isUserConnected: false } ],
	] )( 'shows the connect screen when the site is registered but %s', ( _label, overrides ) => {
		// Pricing present to prove a registered site never sees the upsell.
		setPricing( { title: 'VideoPress', features: [], yearly: {} } );
		mockUseConnection.mockReturnValue( { ...connected, ...overrides } );

		renderGate();

		expect( screen.getByText( 'Connect screen' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Pricing upsell' ) ).not.toBeInTheDocument();
	} );
} );
