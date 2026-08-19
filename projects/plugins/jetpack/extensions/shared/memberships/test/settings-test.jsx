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
	NewsletterAccessDocumentSettings,
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

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect(
				screen.getByRole( 'link', { name: /turn on paid subscribers/i } )
			).toBeInTheDocument();
		} );

		test( 'disables the paid option when Stripe is connected but no tier exists', () => {
			renderPanel( { stripeConnectUrl: CONNECTED, hasTierPlans: false } );

			expect( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect(
				screen.getByRole( 'link', { name: /turn on paid subscribers/i } )
			).toBeInTheDocument();
		} );

		// A native `disabled` attribute would drop the option out of the tab order and
		// hide it from screen readers, defeating the point of surfacing it at all.
		test( 'keeps the paid option reachable and described by the setup link', () => {
			renderPanel( { stripeConnectUrl: NOT_CONNECTED, hasTierPlans: false } );

			const paid = screen.getByRole( 'radio', { name: /^Paid subscribers/ } );
			expect( paid ).toBeEnabled();

			const link = screen.getByRole( 'link', { name: /turn on paid subscribers/i } );
			expect( paid ).toHaveAttribute( 'aria-describedby', link.getAttribute( 'id' ) );

			// A natively disabled input cannot take focus; this one must be able to.
			paid.focus();
			expect( paid ).toHaveFocus();
		} );

		test( 'does not save the paid level when the disabled option is clicked', async () => {
			renderPanel( { stripeConnectUrl: NOT_CONNECTED, hasTierPlans: false } );

			await userEvent.click( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) );
			expect( mockSetPostMeta ).not.toHaveBeenCalled();
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

	describe( 'when the post has a paywall block', () => {
		const renderPaywalled = ( props = {}, selectOptions = {} ) =>
			renderPanel(
				{ postHasPaywallBlock: true, accessLevel: 'subscribers', ...props },
				selectOptions
			);

		// Removing the option instead would make the panel silently change shape. Keeping
		// it visible and disabled matches how paid subscribers behaves when it is unavailable.
		test( 'keeps Everyone visible but not selectable', () => {
			renderPaywalled();

			const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
			expect( everyone ).toHaveAttribute( 'aria-disabled', 'true' );
			expect( everyone ).not.toBeChecked();
		} );

		test( 'does not save the everybody level when the disabled option is clicked', async () => {
			renderPaywalled();

			await userEvent.click( screen.getByRole( 'radio', { name: 'Everyone' } ) );
			expect( mockSetPostMeta ).not.toHaveBeenCalled();
		} );

		// The notice only helps a screen reader user if the option points at it, so the
		// copy is asserted through the description as it is actually computed from
		// aria-describedby rather than by reading the notice on its own.
		test( 'explains why Everyone is unavailable, in a way the option points at', () => {
			renderPaywalled();

			expect( screen.getByText( 'Paywall active' ) ).toBeInTheDocument();

			const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
			expect( everyone ).toHaveAccessibleDescription( /^Paywall active/ );
			expect( everyone ).toHaveAccessibleDescription(
				/Choose who can read the full post\. Everyone can still read the content above the paywall\.$/
			);
		} );

		// A native `disabled` attribute would drop the option out of the tab order and hide
		// it from screen readers, taking the explanation with it.
		test( 'keeps the disabled option focusable', () => {
			renderPaywalled();

			const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
			expect( everyone ).toBeEnabled();

			everyone.focus();
			expect( everyone ).toHaveFocus();
		} );

		// Arrow keys select as they move within a native radio group, so an unselectable
		// option must not share the group's name or it could be chosen by keyboard.
		test( 'leaves the disabled option out of the keyboard group', () => {
			renderPaywalled();

			expect( screen.getByRole( 'radio', { name: 'Everyone' } ) ).not.toHaveAttribute( 'name' );
			expect( screen.getByRole( 'radio', { name: /^Subscribers/ } ) ).toHaveAttribute( 'name' );
		} );

		test( 'still lets the remaining audiences be chosen', async () => {
			renderPaywalled();

			await userEvent.click( screen.getByRole( 'radio', { name: /^Paid subscribers/ } ) );
			expect( mockSetPostMeta ).toHaveBeenCalledWith(
				expect.objectContaining( {
					[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ]: 'paid_subscribers',
				} )
			);
		} );

		// Inserting a paywall block moves the post off "everybody". Until that lands, the
		// option has to stay selectable or the group would show nothing selected at all.
		test( 'leaves Everyone selectable while it is still the saved value', () => {
			renderPaywalled( { accessLevel: 'everybody' } );

			const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
			expect( everyone ).toBeChecked();
			expect( everyone ).not.toHaveAttribute( 'aria-disabled' );
		} );
	} );

	test( 'offers Everyone without explanation when there is no paywall block', () => {
		renderPanel( { accessLevel: 'everybody' } );

		const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
		expect( everyone ).toBeChecked();
		expect( everyone ).not.toHaveAttribute( 'aria-disabled' );
		expect( screen.queryByText( 'Paywall active' ) ).not.toBeInTheDocument();
	} );

	// The counts report how many people can read each level. Switching the paid count to
	// the email reach on a paywalled post would make both options read the same total,
	// so the two must stay distinct here.
	test( 'keeps the paid count distinct from the subscriber count on a paywalled post', () => {
		renderPanel(
			{ postHasPaywallBlock: true, accessLevel: 'paid_subscribers' },
			{ totalSubscribers: 21, paidSubscribers: 2 }
		);

		expect( screen.getByRole( 'radio', { name: 'Subscribers (21)' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Paid subscribers (2)' } ) ).toBeInTheDocument();
	} );
} );

describe( 'NewsletterAccessDocumentSettings', () => {
	const PAYWALL_BLOCK = { name: 'jetpack/paywall', clientId: 'paywall-1' };

	const createMockSelect =
		( { blocks = [] } = {} ) =>
		store => {
			if ( store === 'jetpack/membership-products' ) {
				return {
					isApiStateLoading: () => false,
					getConnectUrl: () => null,
					getNewsletterTierProducts: () => [],
				};
			}
			if ( store === 'core/block-editor' ) {
				return { getBlocks: () => blocks };
			}
			if ( store === membershipProductsStore ) {
				return {
					getSubscriberCounts: () => ( { totalSubscribers: 10, paidSubscribers: 2 } ),
					getNewsletterTierProducts: () => [],
				};
			}
			if ( store === editorStore ) {
				return {
					getCurrentPostType: () => 'post',
					getEditedPostVisibility: () => 'public',
				};
			}
			return {};
		};

	const renderSettings = ( { blocks = [], accessLevel = 'subscribers' } = {} ) => {
		mockUseSelect.mockImplementation( selector => selector( createMockSelect( { blocks } ) ) );
		return render( <NewsletterAccessDocumentSettings accessLevel={ accessLevel } /> );
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseEntityProp.mockReturnValue( [ {}, jest.fn() ] );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector => mockUseSelect( selector ) );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	// The card used to sit above the radio group with an "Edit the block." button that
	// selected the paywall block without switching the sidebar to the Block tab, so it
	// looked inert. The notice explains the constraint instead. Asserting the notice is
	// present is what makes the card's absence meaningful: it proves the paywall block
	// was detected in this render, rather than the card being missing for some other reason.
	test( 'explains the paywall in the panel instead of linking out to the block', () => {
		renderSettings( { blocks: [ PAYWALL_BLOCK ] } );

		expect( screen.getByText( 'Paywall active' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /edit the block/i } ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( /content below the paywall block is exclusive/i )
		).not.toBeInTheDocument();
	} );

	test( 'leaves Everyone selectable when the post has no paywall block', () => {
		renderSettings( { blocks: [ { name: 'core/paragraph', clientId: 'p-1' } ] } );

		expect( screen.getByRole( 'radio', { name: 'Everyone' } ) ).not.toHaveAttribute(
			'aria-disabled'
		);
		expect( screen.queryByText( 'Paywall active' ) ).not.toBeInTheDocument();
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
