import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getConnectUrl } from '../../../utils/connect-url';
import { leavePageFor } from '../../../utils/reload-page';
import ConnectionsSection from '../index';

const NAMES = { myJetpackConnectionCard: 'my_jetpack_connection_card' };
let mockConnectionFrom: typeof NAMES | undefined;

jest.mock( '@automattic/jetpack-connection', () => ( {
	get CONNECTION_FROM() {
		return mockConnectionFrom;
	},
} ) );
jest.mock( '../../../utils/connect-url', () => ( {
	getConnectUrl: jest.fn( () => 'https://wordpress.com/connect' ),
} ) );
jest.mock( '../../../utils/reload-page', () => ( { leavePageFor: jest.fn() } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {
	apiRoot: 'https://example.org/wp-json/',
	apiNonce: 'nonce',
	topJetpackMenuItemUrl: 'https://example.org/wp-admin/admin.php?page=jetpack',
	connectedPlugins: [],
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { adminUrl: 'https://example.org/wp-admin/' } ),
} ) );
// The card has its own tests; here it only needs to hand the click back.
jest.mock( '../../connection-status-card', () => ( {
	__esModule: true,
	default: ( { onConnectUser }: { onConnectUser: () => void } ) => (
		<button onClick={ onConnectUser }>Connect my account</button>
	),
} ) );

describe( 'ConnectionsSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockConnectionFrom = NAMES;
	} );

	const clickConnect = async () => {
		render( <ConnectionsSection /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Connect my account' } ) );
	};

	it( 'connects the account under the card’s own name and leaves for that link', async () => {
		await clickConnect();

		expect( getConnectUrl ).toHaveBeenCalledWith( 'my_jetpack_connection_card' );
		expect( leavePageFor ).toHaveBeenCalledWith( 'https://wordpress.com/connect' );
	} );

	it( 'keeps the legacy name when the shared connection script predates CONNECTION_FROM', async () => {
		mockConnectionFrom = undefined;
		await clickConnect();

		expect( getConnectUrl ).toHaveBeenCalledWith( 'my-jetpack' );
	} );
} );
