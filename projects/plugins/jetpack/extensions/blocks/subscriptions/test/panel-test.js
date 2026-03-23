import { isComingSoon, isPrivateSite } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import * as wpData from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../../shared/memberships/constants';
import { isNewsletterFeatureEnabled } from '../../../shared/memberships/edit';
import { store as membershipProductsStore } from '../../../store/membership-products';
import {
	NewsletterRepublishTracker,
	getNewsletterDisabledMessage,
	default as SubscribePanels,
} from '../panel';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	isComingSoon: jest.fn( () => false ),
	isPrivateSite: jest.fn( () => false ),
	useAnalytics: jest.fn( () => ( { tracks: { recordEvent: jest.fn() } } ) ),
} ) );

jest.mock( '../../../shared/memberships/edit', () => ( {
	useAccessLevel: jest.fn( () => 'everybody' ),
	isNewsletterFeatureEnabled: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/editor', () => ( {
	...jest.requireActual( '@wordpress/editor' ),
	PluginDocumentSettingPanel: ( { children } ) => (
		<div data-testid="document-panel">{ children }</div>
	),
	PluginPrePublishPanel: ( { children } ) => (
		<div data-testid="pre-publish-panel">{ children }</div>
	),
	PluginPostPublishPanel: ( { children } ) => (
		<div data-testid="post-publish-panel">{ children }</div>
	),
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

		expect( message ).toBe( 'Emails will not be sent to subscribers while your site is private' );
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

describe( 'SubscribePanels', () => {
	let useSelectSpy;
	let useDispatchSpy;

	beforeEach( () => {
		jest.clearAllMocks();
		isComingSoon.mockReturnValue( false );
		isPrivateSite.mockReturnValue( false );
		isNewsletterFeatureEnabled.mockReturnValue( true );
		useSelectSpy = jest.spyOn( wpData, 'useSelect' );
		useDispatchSpy = jest.spyOn( wpData, 'useDispatch' );
		useDispatchSpy.mockReturnValue( {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	const createSubscribePanelsMockSelect = ( { postType = 'post' } = {} ) => {
		const editorSelect = {
			getCurrentPostType: () => postType,
		};
		return store => {
			if ( store === editorStore || store === 'core/editor' ) return editorSelect;
			return {};
		};
	};

	test( 'returns null when postType is not post', () => {
		useSelectSpy.mockImplementation( selector =>
			selector( createSubscribePanelsMockSelect( { postType: 'page' } ) )
		);

		const { container } = render( <SubscribePanels /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'returns null when newsletter feature is not enabled', () => {
		isNewsletterFeatureEnabled.mockReturnValue( false );
		useSelectSpy.mockImplementation( selector => selector( createSubscribePanelsMockSelect() ) );

		const { container } = render( <SubscribePanels /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders NewsletterDisabledPanels with coming soon message when site is coming soon', () => {
		isComingSoon.mockReturnValue( true );
		isPrivateSite.mockReturnValue( false );
		useSelectSpy.mockImplementation( selector => selector( createSubscribePanelsMockSelect() ) );

		render( <SubscribePanels /> );

		expect(
			screen.getAllByText( 'You will be able to send newsletters once the site is published' )
				.length
		).toBeGreaterThanOrEqual( 3 );
	} );

	test( 'renders NewsletterDisabledPanels with private site message when site is private', () => {
		isComingSoon.mockReturnValue( false );
		isPrivateSite.mockReturnValue( true );
		useSelectSpy.mockImplementation( selector => selector( createSubscribePanelsMockSelect() ) );

		render( <SubscribePanels /> );

		expect(
			screen.getAllByText( 'Emails will not be sent to subscribers while your site is private' )
				.length
		).toBeGreaterThanOrEqual( 3 );
	} );
} );
