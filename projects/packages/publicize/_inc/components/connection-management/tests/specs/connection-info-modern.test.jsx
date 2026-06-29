import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { store } from '../../../../social-store';
import { setup } from '../../../../utils/test-factory';
import { ModernConnectionInfo } from '../../connection-info-modern';

jest.mock( '../../../connection-icon', () => ( {
	__esModule: true,
	default: () => <div>icon</div>,
} ) );
jest.mock( '../../connection-name', () => ( {
	ConnectionName: ( { connection } ) => <a href="#profile">{ connection.display_name }</a>,
} ) );
jest.mock( '../../connection-status', () => ( {
	ConnectionStatus: () => <div>connection status</div>,
} ) );
jest.mock( '../../connection-template', () => ( {
	ConnectionTemplateEditor: () => <div>template editor</div>,
} ) );
jest.mock( '../../disconnect', () => ( {
	Disconnect: () => <button type="button">Disconnect</button>,
} ) );
jest.mock( '../../mark-as-shared', () => ( {
	MarkAsShared: () => <button type="button">Mark as shared</button>,
} ) );

const CONNECTION = {
	service_name: 'tumblr',
	connection_id: '5',
	display_name: 'My blog',
	status: 'connected',
	profile_link: 'https://example.com',
	profile_picture: 'https://example.com/pic.jpg',
};

const SERVICE = { id: 'tumblr', label: 'Tumblr' };

const renderInfo = ( props = {} ) => {
	setup();
	// `getServicesBy` is consulted for the "unsupported" lookup but isn't part
	// of the shared factory's stubbed selectors, so pin it to an empty result.
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	jest.spyOn( storeSelect, 'getServicesBy' ).mockReturnValue( [] );

	return render(
		<ModernConnectionInfo
			connection={ CONNECTION }
			service={ SERVICE }
			canMarkAsShared={ false }
			{ ...props }
		/>
	);
};

describe( 'ModernConnectionInfo', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the connection name and the network label collapsed', () => {
		renderInfo();

		expect( screen.getByText( 'My blog' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Tumblr' ) ).toBeInTheDocument();
		// The disclosure starts closed, so the trigger reports collapsed.
		expect( screen.getByRole( 'button', { expanded: false } ) ).toBeInTheDocument();
	} );

	test( 'clicking the profile name link does not toggle the disclosure row', async () => {
		const user = userEvent.setup();
		renderInfo();

		const nameLink = screen.getByRole( 'link', { name: 'My blog' } );
		await user.click( nameLink );

		// The row stays collapsed — the link click must not bubble to the trigger.
		expect( screen.getByRole( 'button', { expanded: false } ) ).toBeInTheDocument();
	} );

	test( 'clicking the chevron toggle opens the disclosure', async () => {
		const user = userEvent.setup();
		renderInfo();

		await user.click( screen.getByRole( 'button', { expanded: false } ) );

		expect( screen.getByRole( 'button', { expanded: true } ) ).toBeInTheDocument();
	} );
} );
