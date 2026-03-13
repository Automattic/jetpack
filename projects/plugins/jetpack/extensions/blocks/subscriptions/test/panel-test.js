import { isComingSoon, isPrivateSite } from '@automattic/jetpack-shared-extension-utils';
import { render } from '@testing-library/react';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../../shared/memberships/constants';
import { store as membershipProductsStore } from '../../../store/membership-products';
import { NewsletterRepublishTracker, getNewsletterDisabledMessage } from '../panel';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	isComingSoon: jest.fn( () => false ),
	isPrivateSite: jest.fn( () => false ),
} ) );

const mockSetPublishedWithEmailEnabledInSession = jest.fn();
const mockSetAlreadySentPostModifiedInSession = jest.fn();

describe( 'NewsletterRepublishTracker', () => {
	let useSelectSpy;
	let useDispatchSpy;

	beforeEach( () => {
		jest.clearAllMocks();
		useSelectSpy = jest.spyOn( wpData, 'useSelect' );
		useDispatchSpy = jest.spyOn( wpData, 'useDispatch' );
		useDispatchSpy.mockReturnValue( {
			setPublishedWithEmailEnabledInSession: mockSetPublishedWithEmailEnabledInSession,
			setAlreadySentPostModifiedInSession: mockSetAlreadySentPostModifiedInSession,
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	const createMockSelect = ( {
		postId = 123,
		postMeta = {},
		postEmailSentState = null,
		status = 'draft',
		isSavingPost = false,
	} = {} ) => {
		const editorSelect = {
			getCurrentPost: () => ( postId ? { id: postId, status } : null ),
			getEditedPostAttribute: attr => ( attr === 'meta' ? postMeta : undefined ),
			isSavingPost: () => isSavingPost,
		};
		const membershipSelect = {
			getPostEmailSentState: () => postEmailSentState,
		};
		return store => {
			if ( store === editorStore ) return editorSelect;
			if ( store === membershipProductsStore ) return membershipSelect;
			return {};
		};
	};

	test( 'renders null', () => {
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect();
			return selector( select );
		} );

		const { container } = render( <NewsletterRepublishTracker /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'dispatches setPublishedWithEmailEnabledInSession when status transitions to publish with email enabled', () => {
		// First render: draft status
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: {},
				postEmailSentState: null,
				status: 'draft',
				isSavingPost: false,
			} );
			return selector( select );
		} );

		const { rerender } = render( <NewsletterRepublishTracker /> );
		expect( mockSetPublishedWithEmailEnabledInSession ).not.toHaveBeenCalled();

		// Second render: publish status, email enabled (no _jetpack_dont_email_post_to_subs in meta)
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: {},
				postEmailSentState: null,
				status: 'publish',
				isSavingPost: false,
			} );
			return selector( select );
		} );

		rerender( <NewsletterRepublishTracker /> );
		expect( mockSetPublishedWithEmailEnabledInSession ).toHaveBeenCalledWith( 123 );
	} );

	test( 'does not dispatch setPublishedWithEmailEnabledInSession when email is disabled (post-only meta)', () => {
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: {},
				postEmailSentState: null,
				status: 'draft',
				isSavingPost: false,
			} );
			return selector( select );
		} );

		const { rerender } = render( <NewsletterRepublishTracker /> );

		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true },
				postEmailSentState: null,
				status: 'publish',
				isSavingPost: false,
			} );
			return selector( select );
		} );

		rerender( <NewsletterRepublishTracker /> );
		expect( mockSetPublishedWithEmailEnabledInSession ).not.toHaveBeenCalled();
	} );

	test( 'dispatches setAlreadySentPostModifiedInSession when saving already-sent post', () => {
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: {},
				postEmailSentState: { email_sent_at: 1234567890, stats_on_send: null },
				status: 'publish',
				isSavingPost: true,
			} );
			return selector( select );
		} );

		render( <NewsletterRepublishTracker /> );
		expect( mockSetAlreadySentPostModifiedInSession ).toHaveBeenCalledWith( 123 );
	} );

	test( 'does not dispatch setAlreadySentPostModifiedInSession when post is not already sent', () => {
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: 123,
				postMeta: {},
				postEmailSentState: { email_sent_at: null, stats_on_send: null },
				status: 'publish',
				isSavingPost: true,
			} );
			return selector( select );
		} );

		render( <NewsletterRepublishTracker /> );
		expect( mockSetAlreadySentPostModifiedInSession ).not.toHaveBeenCalled();
	} );

	test( 'does not dispatch when postId is null', () => {
		useSelectSpy.mockImplementation( selector => {
			const select = createMockSelect( {
				postId: null,
				postMeta: {},
				postEmailSentState: { email_sent_at: 1234567890 },
				status: 'publish',
				isSavingPost: true,
			} );
			return selector( select );
		} );

		render( <NewsletterRepublishTracker /> );
		expect( mockSetPublishedWithEmailEnabledInSession ).not.toHaveBeenCalled();
		expect( mockSetAlreadySentPostModifiedInSession ).not.toHaveBeenCalled();
	} );
} );

describe( 'getNewsletterDisabledMessage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		isComingSoon.mockReturnValue( false );
		isPrivateSite.mockReturnValue( false );
	} );

	test( 'returns coming soon message when site is coming soon', () => {
		isComingSoon.mockReturnValue( true );
		isPrivateSite.mockReturnValue( false );

		const message = getNewsletterDisabledMessage();

		expect( message ).toBe( 'You will be able to send newsletters once the site is published' );
	} );

	test( 'returns private site message when site is private', () => {
		isComingSoon.mockReturnValue( false );
		isPrivateSite.mockReturnValue( true );

		const message = getNewsletterDisabledMessage();

		expect( message ).toBe( 'You cannot send newsletters from a private site' );
	} );

	test( 'returns null when site is neither coming soon nor private', () => {
		isComingSoon.mockReturnValue( false );
		isPrivateSite.mockReturnValue( false );

		const message = getNewsletterDisabledMessage();

		expect( message ).toBeNull();
	} );

	test( 'prioritizes coming soon over private when both are true', () => {
		isComingSoon.mockReturnValue( true );
		isPrivateSite.mockReturnValue( true );

		const message = getNewsletterDisabledMessage();

		expect( message ).toBe( 'You will be able to send newsletters once the site is published' );
	} );
} );
