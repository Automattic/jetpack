import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { store as blockEditorStore } from '@wordpress/block-editor';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as membershipProductsStore } from '../../../store/membership-products';
import {
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
	META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
	META_NAME_FOR_POST_TIER_ID_SETTINGS,
} from '../constants';
import {
	getReachForAccessLevelKey,
	NewsletterAccessDocumentSettings,
	NewsletterAccessRadioButtons,
	NewsletterEmailDocumentSettings,
} from '../settings';
import type { ComponentProps, ReactNode } from 'react';

type MockStore = unknown;
type Selector = ( select: ( store: MockStore ) => object ) => unknown;

interface TierProduct {
	id: number;
	title: string;
	price: number;
	interval: string;
}

interface Block {
	name: string;
	clientId: string;
}

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
		useEntityProp: jest.fn( ( ...args: unknown[] ) => mockUseEntityProp( ...args ) ),
		useEntityId: jest.fn( ( ...args: unknown[] ) => mockUseEntityId( ...args ) ),
	};
} );

jest.mock( '@wordpress/editor', () => {
	const actual = jest.requireActual( '@wordpress/editor' );
	return {
		...actual,
		PostVisibilityCheck: ( {
			render: renderProp,
		}: {
			render?: ( args: { canEdit: boolean } ) => ReactNode;
		} ) => ( renderProp ? renderProp( { canEdit: true } ) : null ),
	};
} );

jest.mock( '@wordpress/date', () => ( {
	dateI18n: jest.fn( ( _format: string, date?: string ) => ( date ? '2024-03-15' : '' ) ),
	getDate: jest.fn( ( x?: string ) => ( x ? new Date( x ) : new Date( 0 ) ) ),
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

describe( 'NewsletterAccessRadioButtons', () => {
	const mockSetPostMeta = jest.fn();

	interface MockSelectOptions {
		totalSubscribers?: number;
		paidSubscribers?: number;
		paidNewsletterSubscribers?: number;
		paidSubscribersByTier?: Record< string, number >;
		tierProducts?: TierProduct[];
	}

	const createMockSelect =
		( {
			totalSubscribers = 120,
			paidSubscribers = 8,
			paidNewsletterSubscribers,
			paidSubscribersByTier,
			tierProducts = [],
		}: MockSelectOptions = {} ) =>
		( store: MockStore ) => {
			if ( store === editorStore ) {
				return { getCurrentPostType: () => 'post' };
			}
			if ( store === membershipProductsStore ) {
				return {
					getSubscriberCounts: () => ( {
						totalSubscribers,
						paidSubscribers,
						paidNewsletterSubscribers,
						paidSubscribersByTier,
					} ),
					getNewsletterTierProducts: () => tierProducts,
					isApiStateLoading: () => false,
				};
			}
			return {};
		};

	// stripeConnectUrl === null means Stripe is already connected.
	const CONNECTED = null;
	const NOT_CONNECTED = 'https://connect.stripe.example/oauth';

	const renderPanel = (
		props: Partial< ComponentProps< typeof NewsletterAccessRadioButtons > > = {},
		selectOptions: MockSelectOptions = {}
	) => {
		mockUseSelect.mockImplementation( ( selector: Selector ) =>
			selector( createMockSelect( selectOptions ) )
		);
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
			screen.getByRole( 'radiogroup', { name: /who can read this on your site\?/i } )
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
				'Only subscribers can read it on your site. Others see a preview and can subscribe.'
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

		test( 'saves the chosen tier as a number', async () => {
			const user = userEvent.setup();
			const tierProducts = [
				{ id: 1, title: 'Basic', price: 5, interval: '1 month' },
				{ id: 2, title: 'Premium', price: 10, interval: '1 month' },
			];
			mockUseEntityProp.mockReturnValue( [
				{ [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 2 },
				mockSetPostMeta,
			] );

			renderPanel( { accessLevel: 'paid_subscribers' }, { tierProducts } );

			expect( screen.getByRole( 'radio', { name: 'Premium' } ) ).toBeChecked();

			await user.click( screen.getByRole( 'radio', { name: 'Basic' } ) );

			expect( mockSetPostMeta ).toHaveBeenCalledWith(
				expect.objectContaining( { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 1 } )
			);
		} );

		test( 'clears the saved tier when all paid subscribers is chosen', async () => {
			const user = userEvent.setup();
			const tierProducts = [
				{ id: 1, title: 'Basic', price: 5, interval: '1 month' },
				{ id: 2, title: 'Premium', price: 10, interval: '1 month' },
			];
			mockUseEntityProp.mockReturnValue( [
				{ [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 2 },
				mockSetPostMeta,
			] );

			renderPanel( { accessLevel: 'paid_subscribers' }, { tierProducts } );
			await user.click( screen.getByRole( 'radio', { name: /^All paid subscribers/ } ) );

			expect( mockSetPostMeta ).toHaveBeenCalledWith(
				expect.objectContaining( { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: null } )
			);
		} );

		test( 'labels a saved tier that is no longer offered as deleted', () => {
			mockUseEntityProp.mockReturnValue( [
				{ [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 9 },
				mockSetPostMeta,
			] );

			renderPanel(
				{ accessLevel: 'paid_subscribers' },
				{ tierProducts: [ { id: 1, title: 'Basic', price: 5, interval: '1 month' } ] }
			);

			expect( screen.getByRole( 'radio', { name: 'Deleted tier' } ) ).toBeChecked();
		} );

		// One tier with 1 subscriber; only the "All paid subscribers" count varies.
		const renderSingleTier = ( allPaidSubscribers: number ) =>
			renderPanel(
				{ accessLevel: 'paid_subscribers' },
				{
					tierProducts: [ { id: 1, title: 'Basic', price: 5, interval: '1 month' } ],
					paidNewsletterSubscribers: allPaidSubscribers,
					paidSubscribersByTier: { 1: 1 },
				}
			);

		test( 'shows a lone tier when it reaches fewer people than all paid subscribers', () => {
			renderSingleTier( 5 );

			expect( screen.getByRole( 'radio', { name: 'Basic (1)' } ) ).toBeInTheDocument();
		} );

		test( 'hides a lone tier when it reaches the same people as all paid subscribers', () => {
			renderSingleTier( 1 );

			expect( screen.queryByRole( 'radio', { name: 'Basic (1)' } ) ).not.toBeInTheDocument();
		} );

		test( 'counts only newsletter subscribers next to the paid option', () => {
			renderPanel( {}, { paidSubscribers: 472, paidNewsletterSubscribers: 8 } );

			expect( screen.getByRole( 'radio', { name: 'Paid subscribers (8)' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'when the post has a paywall block', () => {
		const renderPaywalled = (
			props: Partial< ComponentProps< typeof NewsletterAccessRadioButtons > > = {},
			selectOptions: MockSelectOptions = {}
		) =>
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
			expect( screen.queryByText( 'Paywall active' ) ).not.toBeInTheDocument();
		} );

		// The paywall block's own inspector opts out, because Gutenberg's block card
		// directly above it already explains the paywall.
		describe( 'when the caller opts out of the explanation', () => {
			const renderOptedOut = () => renderPaywalled( { explainPaywallConstraint: false } );

			test( 'hides the notice but keeps Everyone visible and disabled', () => {
				renderOptedOut();

				expect( screen.queryByText( 'Paywall active' ) ).not.toBeInTheDocument();
				expect( screen.getByRole( 'radio', { name: 'Everyone' } ) ).toHaveAttribute(
					'aria-disabled',
					'true'
				);
			} );

			// Gating the notice without gating aria-describedby would leave the option
			// pointing at an id that is no longer rendered, which assistive tech reports as
			// no description at all — worse than deliberately having none.
			test( 'leaves no dangling description reference behind', () => {
				renderOptedOut();

				const everyone = screen.getByRole( 'radio', { name: 'Everyone' } );
				expect( everyone ).not.toHaveAttribute( 'aria-describedby' );
				expect( everyone ).toHaveAccessibleDescription( '' );
			} );

			test( 'still refuses to save the everybody level', async () => {
				renderOptedOut();

				await userEvent.click( screen.getByRole( 'radio', { name: 'Everyone' } ) );
				expect( mockSetPostMeta ).not.toHaveBeenCalled();
			} );
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
		( { blocks = [] }: { blocks?: Block[] } = {} ) =>
		( store: MockStore ) => {
			if ( store === membershipProductsStore ) {
				return {
					isApiStateLoading: () => false,
					getConnectUrl: () => null,
					getSubscriberCounts: () => ( { totalSubscribers: 10, paidSubscribers: 2 } ),
					getNewsletterTierProducts: () => [],
				};
			}
			if ( store === blockEditorStore ) {
				return { getBlocks: () => blocks };
			}
			if ( store === editorStore ) {
				return {
					getCurrentPostType: () => 'post',
					getEditedPostVisibility: () => 'public',
				};
			}
			return {};
		};

	const renderSettings = ( {
		blocks = [],
		accessLevel = 'subscribers',
	}: { blocks?: Block[]; accessLevel?: string } = {} ) => {
		mockUseSelect.mockImplementation( ( selector: Selector ) =>
			selector( createMockSelect( { blocks } ) )
		);
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

interface PostEmailSentState {
	email_sent_at: number | null;
	stats_on_send: null;
}

describe( 'NewsletterEmailDocumentSettings', () => {
	const createMockSelect = ( postEmailSentState: PostEmailSentState ) => ( store: MockStore ) => {
		if ( store === editorStore ) {
			return {
				isCurrentPostPublished: () => false,
				getCurrentPostType: () => 'post',
				getEditedPostAttribute: ( attr: string ) => ( attr === 'meta' ? {} : undefined ),
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
		mockUseSelect.mockImplementation( ( selector: Selector ) =>
			selector( createMockSelect( { email_sent_at: 1234567890, stats_on_send: null } ) )
		);

		const { container } = render( <NewsletterEmailDocumentSettings /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders toggle when post is not already sent', async () => {
		mockUseSelect.mockImplementation( ( selector: Selector ) =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null } ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		await expect(
			screen.findByRole( 'checkbox', { name: 'Send this post to subscribers' } )
		).resolves.toBeInTheDocument();
	} );

	test( 'turning the toggle off stores "don’t email" in post meta and saves the post', async () => {
		const user = userEvent.setup();
		const setPostMeta = jest.fn();
		mockUseEntityProp.mockReturnValue( [ {}, setPostMeta ] );
		mockUseSelect.mockImplementation( ( selector: Selector ) =>
			selector( createMockSelect( { email_sent_at: null, stats_on_send: null } ) )
		);

		render( <NewsletterEmailDocumentSettings /> );
		const toggle = screen.getByRole( 'checkbox', { name: 'Send this post to subscribers' } );
		expect( toggle ).toBeChecked();

		await user.click( toggle );

		expect( setPostMeta ).toHaveBeenCalledWith( {
			[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true,
		} );
		expect( mockSaveEditedEntityRecord ).toHaveBeenCalledWith( 'postType', 'post', 1 );
	} );
} );
