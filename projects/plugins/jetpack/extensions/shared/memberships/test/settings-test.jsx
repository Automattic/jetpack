import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as membershipProductsStore } from '../../../store/membership-products';
import { META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from '../constants';
import {
	Link,
	getAccessDescription,
	getReachForAccessLevelKey,
	NewsletterAccessRadioButtons,
	NewsletterEmailDocumentSettings,
} from '../settings';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	isWpcomPlatformSite: jest.fn( () => true ),
} ) );

const mockUseSelect = jest.fn();
const mockUseEntityProp = jest.fn();
const mockUseEntityId = jest.fn();
const mockSaveEditedEntityRecord = jest.fn();

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
			renderProp ? renderProp( { canEdit: true } ) : null,
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

describe( 'getAccessDescription', () => {
	test( 'describes open access for everybody', () => {
		expect( getAccessDescription( 'everybody' ) ).toBe(
			'Anyone can read this post. Subscribers receive it by email.'
		);
	} );

	test( 'describes the subscriber preview for subscribers', () => {
		expect( getAccessDescription( 'subscribers' ) ).toBe(
			'Only subscribers can read this post. Others see a preview and can subscribe. Subscribers receive it by email.'
		);
	} );

	test( 'says only paid subscribers are emailed when there is no paywall block', () => {
		expect( getAccessDescription( 'paid_subscribers' ) ).toBe(
			'Only paid subscribers can read this post. Others see a preview and can subscribe. Only paid subscribers receive it by email.'
		);
	} );

	// With a paywall block the email goes to every subscriber, because free subscribers
	// still receive the portion above the paywall. The copy has to say so explicitly,
	// otherwise it reads as though only paid subscribers are emailed.
	test( 'says all subscribers are emailed when a paywall block is present', () => {
		expect( getAccessDescription( 'paid_subscribers', true ) ).toBe(
			'Only paid subscribers can read the content below the paywall. All subscribers receive it by email.'
		);
	} );

	test( 'scopes the subscribers description to the paywall when one is present', () => {
		expect( getAccessDescription( 'subscribers', true ) ).toBe(
			'Only subscribers can read the content below the paywall. Subscribers receive it by email.'
		);
	} );

	test( 'falls back to the open description for an unknown access level', () => {
		expect( getAccessDescription( undefined ) ).toBe(
			'Anyone can read this post. Subscribers receive it by email.'
		);
	} );
} );

describe( 'NewsletterAccessRadioButtons', () => {
	const mockSetPostMeta = jest.fn();

	const createMockSelect =
		( { totalSubscribers = 120, paidSubscribers = 8, tierProducts = [] } = {} ) =>
		store => {
			if ( store === editorStore ) {
				return { getCurrentPostType: () => 'post' };
			}
			if ( store === membershipProductsStore ) {
				return {
					getSubscriberCounts: () => ( { totalSubscribers, paidSubscribers } ),
					getNewsletterTierProducts: () => tierProducts,
				};
			}
			return {};
		};

	// stripeConnectUrl === null means Stripe is already connected.
	const CONNECTED = null;
	const NOT_CONNECTED = 'https://connect.stripe.example/oauth';

	const renderPanel = ( props = {}, selectOptions = {} ) => {
		mockUseSelect.mockImplementation( selector => selector( createMockSelect( selectOptions ) ) );
		return render(
			<NewsletterAccessRadioButtons
				accessLevel="everybody"
				stripeConnectUrl={ CONNECTED }
				hasTierPlans
				{ ...props }
			/>
		);
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseEntityProp.mockReturnValue( [ {}, mockSetPostMeta ] );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector => mockUseSelect( selector ) );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	test( 'labels the radio group with the question it answers', () => {
		renderPanel();
		expect(
			screen.getByRole( 'radiogroup', { name: /who can read this post\?/i } )
		).toBeInTheDocument();
	} );

	test( 'shows subscriber reach counts next to each audience', () => {
		renderPanel( {}, { totalSubscribers: 2450, paidSubscribers: 122 } );
		expect( screen.getByRole( 'radio', { name: 'Subscribers (2.5K)' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Paid subscribers (122)' } ) ).toBeInTheDocument();
	} );

	test( 'saves the chosen access level', async () => {
		renderPanel();
		await userEvent.click( screen.getByRole( 'radio', { name: /^Subscribers/ } ) );
		expect( mockSetPostMeta ).toHaveBeenCalledWith(
			expect.objectContaining( { [ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: 'subscribers' } )
		);
	} );

	test( 'describes the currently selected access level', () => {
		renderPanel( { accessLevel: 'subscribers' } );
		expect(
			screen.getByText(
				'Only subscribers can read this post. Others see a preview and can subscribe. Subscribers receive it by email.'
			)
		).toBeInTheDocument();
	} );

	describe( 'when paid subscribers are not set up', () => {
		test( 'disables the paid option and links out when Stripe is not connected', () => {
			renderPanel( { stripeConnectUrl: NOT_CONNECTED, hasTierPlans: true } );

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toBeDisabled();
			expect(
				screen.getByRole( 'link', { name: /turn on paid subscribers/i } )
			).toBeInTheDocument();
		} );

		test( 'disables the paid option when Stripe is connected but no tier exists', () => {
			renderPanel( { stripeConnectUrl: CONNECTED, hasTierPlans: false } );

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toBeDisabled();
			expect(
				screen.getByRole( 'link', { name: /turn on paid subscribers/i } )
			).toBeInTheDocument();
		} );

		test( 'still offers the other audiences', () => {
			renderPanel( { stripeConnectUrl: NOT_CONNECTED, hasTierPlans: false } );

			expect( screen.getByRole( 'radio', { name: 'Everyone' } ) ).toBeEnabled();
			expect( screen.getByRole( 'radio', { name: /^Subscribers/ } ) ).toBeEnabled();
		} );

		test( 'sends the setup link to the tier creation screen', () => {
			renderPanel( { stripeConnectUrl: NOT_CONNECTED, hasTierPlans: false } );

			expect( screen.getByRole( 'link', { name: /turn on paid subscribers/i } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( '#add-tier-plan' )
			);
		} );

		// A post saved as paid before Stripe was disconnected must not lose its selection.
		test( 'leaves the paid option enabled when it is already the saved value', () => {
			renderPanel( { accessLevel: 'paid_subscribers', stripeConnectUrl: NOT_CONNECTED } );

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toBeEnabled();
			expect(
				screen.queryByRole( 'link', { name: /turn on paid subscribers/i } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'when paid subscribers are set up', () => {
		test( 'offers the paid option without a setup link', () => {
			renderPanel( { stripeConnectUrl: CONNECTED, hasTierPlans: true } );

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toBeEnabled();
			expect(
				screen.queryByRole( 'link', { name: /turn on paid subscribers/i } )
			).not.toBeInTheDocument();
		} );
	} );

	test( 'omits Everyone when the post has a paywall block', () => {
		renderPanel( { postHasPaywallBlock: true, accessLevel: 'subscribers' } );

		expect( screen.queryByRole( 'radio', { name: 'Everyone' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /^Subscribers/ } ) ).toBeInTheDocument();
	} );
} );

describe( 'NewsletterEmailDocumentSettings', () => {
	const createMockSelect = postEmailSentState => store => {
		if ( store === editorStore ) {
			return {
				isCurrentPostPublished: () => false,
				getCurrentPostType: () => 'post',
				getEditedPostAttribute: attr => ( attr === 'meta' ? {} : undefined ),
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
		mockUseEntityProp.mockReturnValue( [ {}, jest.fn() ] );
		mockUseEntityId.mockReturnValue( 1 );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector => {
			return mockUseSelect( selector );
		} );
		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( {
			saveEditedEntityRecord: mockSaveEditedEntityRecord,
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
} );
