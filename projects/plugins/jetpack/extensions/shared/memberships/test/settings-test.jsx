import { render, renderHook, screen } from '@testing-library/react';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as membershipProductsStore } from '../../../store/membership-products';
import {
	Link,
	getReachForAccessLevelKey,
	NewsletterEmailDocumentSettings,
	useSetAccess,
} from '../settings';

const mockUseSelect = jest.fn();
const mockUseEntityProp = jest.fn();
const mockUseEntityId = jest.fn();
let mockCanEdit = true;

jest.mock( '@wordpress/core-data', () => {
	const actual = jest.requireActual( '@wordpress/core-data' );
	return {
		...actual,
		useEntityProp: jest.fn( ( ...args ) => mockUseEntityProp( ...args ) ),
		useEntityId: jest.fn( ( ...args ) => mockUseEntityId( ...args ) ),
	};
} );

jest.mock( '@wordpress/editor', () => {
	const actual = jest.requireActual( '@wordpress/editor' );
	return {
		...actual,
		PostVisibilityCheck: ( { render: renderProp } ) =>
			renderProp ? renderProp( { canEdit: mockCanEdit } ) : null,
	};
} );

jest.mock( '@wordpress/date', () => ( {
	dateI18n: jest.fn( ( format, date ) => ( date ? '2024-03-15' : '' ) ),
	getDate: jest.fn( x => ( x ? new Date( x ) : new Date( 0 ) ) ),
	getSettings: jest.fn( () => ( {
		formats: { date: 'F j, Y' },
		l10n: { startOfWeek: 0 },
		timezone: { offset: 0, string: '' },
	} ) ),
} ) );

describe( 'getReachForAccessLevelKey', () => {
	test( 'returns subscribers count for everybody', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'everybody',
				subscribers: 100,
				paidSubscribers: 10,
			} )
		).toBe( 100 );
	} );

	test( 'returns subscribers count for subscribers access level', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'subscribers',
				subscribers: 50,
				paidSubscribers: 5,
			} )
		).toBe( 50 );
	} );

	test( 'returns paidSubscribers for paid_subscribers when no paywall', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'paid_subscribers',
				subscribers: 100,
				paidSubscribers: 20,
				postHasPaywallBlock: false,
			} )
		).toBe( 20 );
	} );

	test( 'returns subscribers for paid_subscribers when paywall present', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'paid_subscribers',
				subscribers: 100,
				paidSubscribers: 20,
				postHasPaywallBlock: true,
			} )
		).toBe( 100 );
	} );

	test( 'handles null/undefined with fallback to 0', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'subscribers',
				subscribers: null,
				paidSubscribers: undefined,
			} )
		).toBe( 0 );
	} );

	test( 'returns 0 for unknown access level', () => {
		expect(
			getReachForAccessLevelKey( {
				accessLevel: 'unknown',
				subscribers: 100,
				paidSubscribers: 10,
			} )
		).toBe( 0 );
	} );
} );

describe( 'Link', () => {
	test( 'renders anchor with href and children', () => {
		render(
			<Link href="https://example.com">
				<span>Click me</span>
			</Link>
		);
		const link = screen.getByRole( 'link', { name: /click me/i } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com' );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link ).toHaveAttribute( 'rel', 'noopener noreferrer' );
	} );

	test( 'has jetpack-newsletter-link class', () => {
		render( <Link href="/">Test</Link> );
		expect( screen.getByRole( 'link' ) ).toHaveClass( 'jetpack-newsletter-link' );
	} );
} );

describe( 'NewsletterEmailDocumentSettings', () => {
	const createMockSelect =
		( postEmailSentState, status = 'draft' ) =>
		store => {
			if ( store === editorStore ) {
				return {
					getCurrentPostType: () => 'post',
					getEditedPostAttribute: attr => {
						if ( attr === 'meta' ) {
							return {};
						}
						return attr === 'status' ? status : undefined;
					},
				};
			}
			if ( store === membershipProductsStore ) {
				return {
					getPostEmailSentState: () => postEmailSentState,
				};
			}
			return {};
		};

	beforeEach( () => {
		jest.clearAllMocks();
		mockCanEdit = true;
		mockUseEntityProp.mockReturnValue( [ {}, jest.fn() ] );
		mockUseEntityId.mockReturnValue( 1 );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector => {
			return mockUseSelect( selector );
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	test( 'returns null when post is already sent (postEmailSentState has email_sent_at)', () => {
		mockUseSelect.mockImplementation( selector =>
			selector( createMockSelect( { email_sent_at: 1234567890, stats_on_send: null } ) )
		);

		const { container } = render( <NewsletterEmailDocumentSettings /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders toggle when post is not already sent', () => {
		mockUseSelect.mockImplementation( selector =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null } ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		expect( screen.getByLabelText( /Send as email to subscribers/i ) ).toBeInTheDocument();
	} );

	test( 'renders the setting as text, not a dead control, when the user cannot edit', () => {
		mockCanEdit = false;
		mockUseSelect.mockImplementation( selector =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null } ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		expect( screen.queryByRole( 'radio', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Post & email' ) ).toBeInTheDocument();
	} );

	test( 'renders the setting as text once the post is published', () => {
		mockUseSelect.mockImplementation( selector =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null }, 'publish' ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		expect( screen.queryByRole( 'radio', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	// A private post still emails subscribers when it goes public.
	test( 'keeps the toggle editable on a private post', () => {
		mockUseSelect.mockImplementation( selector =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null }, 'private' ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		expect( screen.getByLabelText( /Send as email to subscribers/i ) ).toBeInTheDocument();
	} );
} );

describe( 'useSetAccess', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseEntityId.mockReturnValue( 1 );
		jest
			.spyOn( wpData, 'useSelect' )
			.mockImplementation( selector =>
				selector( store => ( store === editorStore ? { getCurrentPostType: () => 'post' } : {} ) )
			);
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	// The phantom-dirt fix relies on staged meta keeping every key the record has.
	test( 'clears the tier without dropping the key or mutating the record', () => {
		const metas = { _jetpack_newsletter_tier_id: 42, other: 'keep' };
		const setPostMeta = jest.fn();
		mockUseEntityProp.mockReturnValue( [ metas, setPostMeta ] );

		const { result } = renderHook( () => useSetAccess() );
		result.current( 'subscribers' );

		expect( setPostMeta ).toHaveBeenCalledWith( {
			_jetpack_newsletter_tier_id: 0,
			_jetpack_newsletter_access: 'subscribers',
			other: 'keep',
		} );
		expect( metas ).toEqual( { _jetpack_newsletter_tier_id: 42, other: 'keep' } );
	} );
} );
