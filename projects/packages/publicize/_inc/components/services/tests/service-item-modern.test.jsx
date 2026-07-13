import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setup } from '../../../utils/test-factory';
import { ModernServiceItem } from '../service-item-modern';

jest.mock( '../connect-form', () => ( {
	ConnectForm: () => <div>Connect Form</div>,
} ) );
jest.mock( '../service-item-details', () => ( {
	ServiceItemDetails: () => <div>Service Details</div>,
} ) );
jest.mock( '../service-status', () => ( {
	ServiceStatus: () => <div>Service Status</div>,
} ) );

const SERVICE = {
	id: 'mastodon',
	label: 'Mastodon',
	description: 'Share with your network.',
	needsCustomInputs: true,
	icon: () => <svg aria-hidden="true" />,
};

describe( 'ModernServiceItem', () => {
	beforeEach( () => {
		setup();
		// jsdom doesn't implement scrollIntoView, which the auto-open path calls.
		// eslint-disable-next-line jest/prefer-spy-on
		Element.prototype.scrollIntoView = jest.fn();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the service heading collapsed by default', () => {
		render( <ModernServiceItem service={ SERVICE } serviceConnections={ [] } /> );

		expect( screen.getByText( 'Mastodon' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { expanded: false } ) ).toBeInTheDocument();
	} );

	test( 'expands the panel to reveal the service details when the row is clicked', async () => {
		const user = userEvent.setup();
		render( <ModernServiceItem service={ SERVICE } serviceConnections={ [] } /> );

		await user.click( screen.getByRole( 'button', { expanded: false } ) );

		expect( screen.getByRole( 'button', { expanded: true } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Service Details' ) ).toBeInTheDocument();
	} );

	test( 'opens with the panel already expanded when isPanelDefaultOpen is set', () => {
		render(
			<ModernServiceItem service={ SERVICE } serviceConnections={ [] } isPanelDefaultOpen />
		);

		expect( screen.getByRole( 'button', { expanded: true } ) ).toBeInTheDocument();
	} );
} );
