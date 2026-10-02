import { render } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { accessOptions } from '../../../shared/memberships/constants';
import PaywallEdit from '../edit';

const CLIENT_ID = 'paywall-client-id';

const mockSetAccess = jest.fn();
let mockAccessLevel: string;
let mockPaywallBlock: { clientId: string } | undefined;

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
	BlockControls: () => null,
	InspectorControls: () => null,
} ) );

jest.mock( '@wordpress/editor', () => ( { store: { name: 'core/editor' } } ) );
jest.mock( '../../../shared/components/plans-setup-dialog', () => () => null );
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
		getConnectUrl: () => null,
		getNewsletterTierProducts: () => [ { id: 1 } ],
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
