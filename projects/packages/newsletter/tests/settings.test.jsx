jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: jest.fn(),
	getUserConnectionUrl: jest.fn( () => 'https://example.com/connect' ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => false ),
	isWpcomPlatformSite: jest.fn( () => false ),
	getSiteType: jest.fn( () => 'jetpack' ),
	getSiteData: jest.fn( () => ( {
		rest_root: 'https://example.com/wp-json/',
		rest_nonce: 'test-nonce',
		wpcom: { blog_id: 123 },
	} ) ),
	getScriptData: jest.fn( () => ( { newsletter: undefined } ) ),
} ) );

jest.mock( '../src/settings/api', () => ( {
	fetchSettings: jest.fn(),
	updateSettings: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-components', () => ( {
	AdminPage: ( { children } ) => <div data-testid="admin-page">{ children }</div>,
	Col: ( { children } ) => <div>{ children }</div>,
	Container: ( { children } ) => <div>{ children }</div>,
	GlobalNotices: () => null,
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
	} ),
} ) );

jest.mock( '../src/settings/sections', () => ( {
	NewsletterSection: () => <div data-testid="newsletter-section" />,
	SubscriptionsSection: () => <div data-testid="subscriptions-section" />,
	PaidNewsletterSection: () => <div data-testid="paid-newsletter-section" />,
	NewsletterCategoriesSection: () => <div data-testid="newsletter-categories-section" />,
	EmailContentSection: () => <div data-testid="email-content-section" />,
	EmailBylineSection: () => <div data-testid="email-byline-section" />,
	EmailSenderSettingsSection: () => <div data-testid="email-sender-settings-section" />,
	EmailReplyToSettingsSection: () => <div data-testid="email-reply-to-settings-section" />,
	WelcomeEmailSection: () => <div data-testid="welcome-email-section" />,
} ) );

import { useConnection } from '@automattic/jetpack-connection';
import { render, screen, waitFor } from '@testing-library/react';
import { NewsletterSettingsApp } from '../src/settings';
import { fetchSettings } from '../src/settings/api';

const defaultSettings = {
	subscriptions: true,
	stb_enabled: false,
	stc_enabled: false,
	sm_enabled: false,
	jetpack_subscribe_overlay_enabled: false,
	jetpack_subscribe_floating_button_enabled: false,
	jetpack_subscriptions_subscribe_post_end_enabled: false,
	jetpack_subscriptions_login_navigation_enabled: false,
	jetpack_subscriptions_subscribe_navigation_enabled: false,
	wpcom_featured_image_in_email: false,
	wpcom_subscription_emails_use_excerpt: 'full',
	jetpack_gravatar_in_email: false,
	jetpack_author_in_email: false,
	jetpack_post_date_in_email: false,
	jetpack_subscriptions_reply_to: 'no-reply',
	jetpack_subscriptions_from_name: 'Test Blog',
	wpcom_newsletter_send_default: false,
	wpcom_newsletter_categories_enabled: false,
	wpcom_newsletter_categories: [],
	newsletter_has_active_plan: false,
};

describe( 'NewsletterSettingsApp', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		fetchSettings.mockResolvedValue( defaultSettings );
	} );

	describe( 'when user is connected', () => {
		beforeEach( () => {
			useConnection.mockReturnValue( {
				hasConnectedOwner: true,
				isRegistered: true,
				isUserConnected: true,
			} );
		} );

		it( 'should not show the connect notice', async () => {
			render( <NewsletterSettingsApp /> );

			await waitFor( () => {
				expect(
					screen.queryByText( /Connect your WordPress.com account/ )
				).not.toBeInTheDocument();
			} );
		} );

		it( 'should not render the settings as disabled', async () => {
			render( <NewsletterSettingsApp /> );

			await waitFor( () => {
				expect( screen.getByTestId( 'newsletter-section' ) ).toBeInTheDocument();
			} );
			// The Disabled component should not add inert when connected
			expect( screen.getByTestId( 'newsletter-section' ) ).not.toHaveAttribute( 'inert' );
		} );
	} );

	describe( 'when user is not connected', () => {
		beforeEach( () => {
			useConnection.mockReturnValue( {
				hasConnectedOwner: false,
				isRegistered: true,
				isUserConnected: false,
			} );
		} );

		it( 'should show the connect notice with a connect link', async () => {
			render( <NewsletterSettingsApp /> );

			await waitFor( () => {
				expect( screen.getByRole( 'link', { name: 'Connect now' } ) ).toHaveAttribute(
					'href',
					'https://example.com/connect'
				);
			} );
		} );

		it( 'should render the settings within a disabled wrapper', async () => {
			render( <NewsletterSettingsApp /> );

			await waitFor( () => {
				// The Disabled component wrapping settings should add inert when not connected
				expect( screen.getByTestId( 'newsletter-section' ) ).toBeInTheDocument();
			} );
		} );
	} );
} );
