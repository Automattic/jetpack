import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as membershipProductsStore } from '../../../store/membership-products';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../constants';
import { Link, getReachForAccessLevelKey, NewsletterEmailDocumentSettings } from '../settings';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockUseSelect = jest.fn();
const mockUseEntityProp = jest.fn();
const mockUseEntityId = jest.fn();
const mockReceiveEntityRecords = jest.fn();
const mockEditEntityRecord = jest.fn();
const mockGetEntityRecordEdits = jest.fn();
const mockCreateErrorNotice = jest.fn();

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
		if ( store === coreDataStore ) {
			return {
				getEntityConfig: () => ( { baseURL: '/wp/v2/posts' } ),
				getEntityRecordEdits: mockGetEntityRecordEdits,
			};
		}
		return {};
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseEntityProp.mockReturnValue( [ {}, jest.fn() ] );
		mockUseEntityId.mockReturnValue( 1 );
		mockGetEntityRecordEdits.mockReturnValue( undefined );
		jest.spyOn( wpData, 'useSelect' ).mockImplementation( selector => {
			return mockUseSelect( selector );
		} );
		jest.spyOn( wpData, 'useDispatch' ).mockReturnValue( {
			receiveEntityRecords: mockReceiveEntityRecords,
			editEntityRecord: mockEditEntityRecord,
			createErrorNotice: mockCreateErrorNotice,
		} );
		jest.spyOn( wpData, 'useRegistry' ).mockReturnValue( { select: createMockSelect( null ) } );
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

	describe( 'toggling', () => {
		beforeEach( () => {
			mockUseSelect.mockImplementation( selector =>
				selector( createMockSelect( { email_sent_at: null, stats_on_send: null } ) )
			);
		} );

		test( 'writes only the flag and hands the response back to the store', async () => {
			const updatedPost = { id: 1, meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true } };
			apiFetch.mockResolvedValue( updatedPost );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/posts/1',
				method: 'POST',
				data: { meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true } },
			} );
			await waitFor( () =>
				expect( mockReceiveEntityRecords ).toHaveBeenCalledWith(
					'postType',
					'post',
					updatedPost,
					undefined,
					true
				)
			);
		} );

		test( 'notices a failed write instead of failing silently', async () => {
			apiFetch.mockRejectedValue( new Error( 'nope' ) );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			await waitFor( () => expect( mockCreateErrorNotice ).toHaveBeenCalled() );
			expect( mockReceiveEntityRecords ).not.toHaveBeenCalled();
		} );

		test( 'does not write before the post has an id', async () => {
			mockUseEntityId.mockReturnValue( undefined );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			expect( apiFetch ).not.toHaveBeenCalled();
			expect( mockCreateErrorNotice ).toHaveBeenCalled();
		} );

		test( 'realigns a staged meta edit that would shadow the write', async () => {
			mockGetEntityRecordEdits.mockReturnValue( {
				meta: {
					[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: false,
					_jetpack_newsletter_access: 'subscribers',
				},
			} );
			apiFetch.mockResolvedValue( { id: 1, meta: {} } );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			await waitFor( () =>
				expect( mockEditEntityRecord ).toHaveBeenCalledWith(
					'postType',
					'post',
					1,
					{ meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true } },
					{ undoIgnore: true }
				)
			);
		} );

		test( 'stages nothing when no meta edit is pending', async () => {
			apiFetch.mockResolvedValue( { id: 1, meta: {} } );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			await waitFor( () => expect( mockReceiveEntityRecords ).toHaveBeenCalled() );
			expect( mockEditEntityRecord ).not.toHaveBeenCalled();
		} );

		test( 'ignores a second toggle while the write is in flight, without disabling the options', async () => {
			let resolveWrite;
			apiFetch.mockReturnValue( new Promise( resolve => ( resolveWrite = resolve ) ) );

			render( <NewsletterEmailDocumentSettings /> );
			await userEvent.click( screen.getByRole( 'radio', { name: 'Post only' } ) );

			// Disabling would pull focus off the option the user just activated.
			expect( screen.getByRole( 'radio', { name: 'Post only' } ) ).toBeEnabled();
			expect( screen.getByRole( 'radio', { name: 'Post & email' } ) ).toBeEnabled();

			await userEvent.click( screen.getByRole( 'radio', { name: 'Post & email' } ) );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );

			resolveWrite( { id: 1, meta: {} } );
			await waitFor( () => expect( mockReceiveEntityRecords ).toHaveBeenCalled() );
		} );
	} );
} );
