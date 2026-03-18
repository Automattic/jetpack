import { render, screen } from '@testing-library/react';
import { accessOptions } from '../../../shared/memberships/constants';
import PaywallEdit from '../edit';

// Mock variables - must start with "mock" to be accessible in jest.mock factories
const mockSetAccess = jest.fn();
const mockGetBlocks = jest.fn();
let mockSavedAccessLevel: string | undefined = 'everybody';
let mockAccessLevel = 'everybody';

// Mock window.wp.data for cleanup function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
( window as any ).wp = {
	data: {
		select: jest.fn().mockReturnValue( {
			getBlocks: mockGetBlocks,
		} ),
	},
};

jest.mock( '../../../shared/use-is-user-connected', () => ( {
	__esModule: true,
	default: jest.fn( () => true ),
} ) );

jest.mock( '../../../shared/memberships/edit', () => ( {
	useAccessLevel: jest.fn( () => mockAccessLevel ),
} ) );

jest.mock( '../../../shared/memberships/settings', () => ( {
	useSetAccess: () => mockSetAccess,
	NewsletterAccessRadioButtons: () => {},
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => {},
	BlockControls: () => {},
	InspectorControls: () => {},
} ) );

jest.mock( '@wordpress/components', () => ( {
	MenuGroup: () => {},
	MenuItem: () => {},
	PanelBody: () => {},
	ToolbarDropdownMenu: () => {},
} ) );

jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	JetpackEditorPanelLogo: () => {},
} ) );

jest.mock( '../../../shared/components/connect-banner', () => {} );

jest.mock( '../../../shared/components/plans-setup-dialog', () => ( {
	__esModule: true,
	default: () => {},
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( selector => {
		const mockSelect = storeName => {
			if ( storeName === 'core/editor' ) {
				return {
					getCurrentPostType: () => 'post',
					getCurrentPostAttribute: attr => {
						if ( attr === 'meta' ) {
							return { _jetpack_newsletter_access: mockSavedAccessLevel };
						}
						return undefined;
					},
				};
			}
			if ( storeName === 'jetpack/membership-products' ) {
				return {
					getNewsletterTierProducts: () => [ { id: 1 } ],
					getConnectUrl: () => null,
				};
			}
			return {};
		};
		return selector( mockSelect );
	} ),
} ) );

describe( 'PaywallEdit', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetBlocks.mockReturnValue( [ { name: 'jetpack/paywall' } ] );
	} );

	test( 'does not set access saved access is undefined', () => {
		mockSavedAccessLevel = undefined;

		render( <PaywallEdit /> );

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	test( 'sets access to "subscribers" when saved access is ""', () => {
		mockSavedAccessLevel = '';

		render( <PaywallEdit /> );

		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );
	} );

	test( 'sets access to "subscribers" when saved access is "everybody"', () => {
		mockSavedAccessLevel = 'everybody';

		render( <PaywallEdit /> );

		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );
	} );

	test( 'does not change access when saved access is "subscribers"', () => {
		mockSavedAccessLevel = 'subscribers';

		render( <PaywallEdit /> );

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	test( 'does not change access when saved access is "paid_subscribers"', () => {
		mockSavedAccessLevel = 'paid_subscribers';

		render( <PaywallEdit /> );

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	test( 'only sets default access once even on re-render', () => {
		mockSavedAccessLevel = 'everybody';

		const { rerender } = render( <PaywallEdit /> );

		expect( mockSetAccess ).toHaveBeenCalledTimes( 1 );
		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );

		mockSetAccess.mockClear();
		rerender( <PaywallEdit /> );

		expect( mockSetAccess ).not.toHaveBeenCalled();
	} );

	test( 'resets access to "everybody" when paywall block is removed', () => {
		mockSavedAccessLevel = 'subscribers';
		mockGetBlocks.mockReturnValue( [] ); // No paywall block

		const { unmount } = render( <PaywallEdit /> );
		unmount();

		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.everybody.key );
	} );

	test( 'renders subscribers only content when access level is "subscribers"', () => {
		mockSavedAccessLevel = 'subscribers';
		mockAccessLevel = 'subscribers';

		render( <PaywallEdit /> );

		expect( screen.getByText( 'Subscriber-only content below' ) ).toBeInTheDocument();
	} );

	test( 'renders paid content text when access is "paid_subscribers"', () => {
		mockSavedAccessLevel = 'paid_subscribers';
		mockAccessLevel = 'paid_subscribers';

		render( <PaywallEdit /> );

		expect( screen.getByText( 'Paid content below this line' ) ).toBeInTheDocument();
	} );

	test( 'sets access to "subscribers" when paywall block is re-added after removal', () => {
		mockSavedAccessLevel = 'everybody';
		mockGetBlocks.mockReturnValue( [ { name: 'jetpack/paywall' } ] );

		// First render.
		const { unmount } = render( <PaywallEdit /> );
		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );

		// Simulate block removal - cleanup should reset to 'everybody'.
		mockSetAccess.mockClear();
		mockGetBlocks.mockReturnValue( [] ); // No paywall block
		unmount();
		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.everybody.key );

		// Re-adding the block.
		mockSetAccess.mockClear();
		mockSavedAccessLevel = 'everybody'; // Access was reset to 'everybody' by cleanup
		mockGetBlocks.mockReturnValue( [ { name: 'jetpack/paywall' } ] );

		render( <PaywallEdit /> );
		expect( mockSetAccess ).toHaveBeenCalledWith( accessOptions.subscribers.key );
	} );
} );
