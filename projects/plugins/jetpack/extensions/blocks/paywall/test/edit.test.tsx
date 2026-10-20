import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { accessOptions } from '../../../shared/memberships/constants';
import PaywallEdit from '../edit';

const CLIENT_ID = 'paywall-client-id';

const mockSetAccess = jest.fn();
let mockAccessLevel: string;
let mockPaywallBlock: { clientId: string } | undefined;
let mockConnectUrl: string | null;
let mockTierProducts: Array< { id: number } >;
let mockIsLoading: boolean;

// The block reads the access level from post meta and writes it back through these two hooks.
// Standing in for them is what lets the test say what the post's access is, and see what the
// block does about it.
jest.mock( '../../../shared/memberships/edit', () => ( {
	useAccessLevel: () => mockAccessLevel,
} ) );

jest.mock( '../../../shared/memberships/settings', () => ( {
	useSetAccess: () => mockSetAccess,
	NewsletterAccessRadioButtons: () => null,
} ) );

// Editor chrome the block renders but these tests never look at. Stubbed because the real
// modules need a mounted block and a connected user to render at all.
jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
	useBlockProps: () => ( {} ),
	BlockControls: ( { children } ) => children,
	InspectorControls: () => null,
} ) );

jest.mock( '@wordpress/editor', () => ( { store: { name: 'core/editor' } } ) );
jest.mock( '../../../shared/use-is-user-connected', () => () => true );

// Everything the block looks up through useSelect, in one place.
const registry = createRegistry();
registry.registerStore( 'core/editor', {
	reducer: () => ( {} ),
	selectors: { getCurrentPostType: () => 'post' },
} );
registry.registerStore( 'core/block-editor', {
	reducer: () => ( {} ),
	selectors: { getBlock: () => mockPaywallBlock },
} );
registry.registerStore( 'jetpack/membership-products', {
	reducer: () => ( {} ),
	selectors: {
		getConnectUrl: () => mockConnectUrl,
		getNewsletterTierProducts: () => mockTierProducts,
		isApiStateLoading: () => mockIsLoading,
	},
} );

const renderPaywall = ( options = {} ) =>
	render(
		<RegistryProvider value={ registry }>
			<PaywallEdit clientId={ CLIENT_ID } />
		</RegistryProvider>,
		options
	);

describe( 'PaywallEdit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockAccessLevel = accessOptions.paid_subscribers.key;
		mockPaywallBlock = { clientId: CLIENT_ID };
		mockConnectUrl = null;
		mockTierProducts = [ { id: 1 } ];
		mockIsLoading = false;
	} );

	test( 'shows paid subscribers as unavailable in the toolbar until payments are set up', async () => {
		mockAccessLevel = accessOptions.subscribers.key;
		mockConnectUrl = 'https://example.com/connect-stripe';
		mockTierProducts = [];
		renderPaywall();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.subscribers.label } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByRole( 'menuitem', { name: /Turn on paid subscribers/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '#add-tier-plan' )
		);
	} );

	test( 'keeps paid subscribers disabled without a setup prompt while the status is loading', async () => {
		mockAccessLevel = accessOptions.subscribers.key;
		mockConnectUrl = null;
		mockTierProducts = [];
		mockIsLoading = true;
		renderPaywall();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.subscribers.label } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		).toHaveAttribute( 'aria-disabled', 'true' );
		expect(
			screen.queryByRole( 'menuitem', { name: /Turn on paid subscribers/ } )
		).not.toBeInTheDocument();
	} );

	test( 'does not save paid access when it is clicked while the status is loading', async () => {
		mockAccessLevel = accessOptions.subscribers.key;
		mockConnectUrl = null;
		mockTierProducts = [];
		mockIsLoading = true;
		renderPaywall();
		mockSetAccess.mockClear();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.subscribers.label } )
		);
		await userEvent.click(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		);

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	test( 'links to the payments page without the tier anchor when a tier already exists', async () => {
		mockAccessLevel = accessOptions.subscribers.key;
		mockConnectUrl = 'https://example.com/connect-stripe';
		renderPaywall();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.subscribers.label } )
		);

		const setupLink = screen.getByRole( 'menuitem', { name: /Turn on paid subscribers/ } );
		expect( setupLink.getAttribute( 'href' ) ).not.toContain( '#add-tier-plan' );
		expect(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		).toHaveAttribute( 'aria-describedby', setupLink.id );
	} );

	test( 'keeps paid subscribers selectable on a paid post after Stripe disconnects', async () => {
		mockConnectUrl = 'https://example.com/connect-stripe';
		renderPaywall();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.paid_subscribers.label } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		).not.toHaveAttribute( 'aria-disabled' );
	} );

	test( 'offers paid subscribers in the toolbar once payments are set up', async () => {
		mockAccessLevel = accessOptions.subscribers.key;
		renderPaywall();

		await userEvent.click(
			screen.getByRole( 'button', { name: accessOptions.subscribers.label } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		).not.toHaveAttribute( 'aria-disabled' );
		expect(
			screen.queryByRole( 'menuitem', { name: /Turn on paid subscribers/ } )
		).not.toBeInTheDocument();
		mockSetAccess.mockClear();
		await userEvent.click(
			screen.getByRole( 'menuitem', { name: accessOptions.paid_subscribers.label } )
		);
		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.paid_subscribers.key );
	} );

	test( 'reopens the post to everyone once the block has been removed from it', () => {
		const { unmount } = renderPaywall();
		mockPaywallBlock = undefined;
		unmount();

		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.everybody.key );
	} );

	test( 'raises a post everyone can read to subscribers', () => {
		mockAccessLevel = accessOptions.everybody.key;
		renderPaywall();

		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );
	} );

	test( 'leaves a subscriber-only post alone', () => {
		mockAccessLevel = accessOptions.subscribers.key;
		renderPaywall();

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	// The editor renders under StrictMode, which on development builds of React mounts, unmounts
	// and remounts every component. Treating that unmount as a removal downgraded a paid post to
	// subscribers on nothing more than a page load.
	test( 'keeps a paid post paid across a StrictMode remount', () => {
		renderPaywall( { reactStrictMode: true } );

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );
} );
