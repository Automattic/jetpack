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

// Capture the parent's wired props for `SubscribeModalSection` so the
// describe block below can drive `handleSubscribeModalChange`,
// `saveSubscribeModal`, and `hasSubscribeModalChanges` without going through
// the real card UI.
const subscribeModalProps = { current: null };

jest.mock( '../src/settings/sections', () => ( {
	EmailBylineSection: () => <div data-testid="email-byline-section" />,
	EmailContentSection: () => <div data-testid="email-content-section" />,
	EmailDefaultsSection: () => <div data-testid="email-defaults-section" />,
	EmailReplyToSettingsSection: () => <div data-testid="email-reply-to-settings-section" />,
	EmailSenderSettingsSection: () => <div data-testid="email-sender-settings-section" />,
	LegacySubscriptionsSection: () => <div data-testid="legacy-subscriptions-section" />,
	NewsletterCategoriesSection: () => <div data-testid="newsletter-categories-section" />,
	NewsletterSection: () => <div data-testid="newsletter-section" />,
	PaidNewsletterSection: () => <div data-testid="paid-newsletter-section" />,
	SubscribeModalSection: props => {
		subscribeModalProps.current = props;
		return <div data-testid="subscribe-modal-section" />;
	},
	SubscriptionsSection: () => <div data-testid="subscriptions-section" />,
	WelcomeEmailSection: () => <div data-testid="welcome-email-section" />,
} ) );

import { useConnection } from '@automattic/jetpack-connection';
import { act, render, screen, waitFor } from '@testing-library/react';
import { NewsletterSettingsApp } from '../src/settings';
import { fetchSettings, updateSettings } from '../src/settings/api';

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

	describe( 'SubscribeModalSection wiring', () => {
		beforeEach( () => {
			useConnection.mockReturnValue( {
				hasConnectedOwner: true,
				isRegistered: true,
				isUserConnected: true,
			} );
			subscribeModalProps.current = null;
		} );

		const renderAndWait = async () => {
			render( <NewsletterSettingsApp /> );
			await waitFor( () => {
				expect( subscribeModalProps.current ).not.toBeNull();
			} );
		};

		it( 'starts with hasChanges=false, isSaving=false, and empty changedKeys', async () => {
			await renderAndWait();

			expect( subscribeModalProps.current.hasChanges ).toBe( false );
			expect( subscribeModalProps.current.isSaving ).toBe( false );
			expect( subscribeModalProps.current.changedKeys ).toEqual( [] );
		} );

		it( 'flips hasChanges to true after onChange stages a subscription_options update', async () => {
			await renderAndWait();

			act( () => {
				subscribeModalProps.current.onChange( {
					subscription_options: {
						invitation: 'I',
						welcome: 'W',
						comment_follow: 'CF',
						subscribe_modal_heading: 'New heading',
					},
				} );
			} );

			await waitFor( () => {
				expect( subscribeModalProps.current.hasChanges ).toBe( true );
			} );
			expect( subscribeModalProps.current.changedKeys ).toEqual( [ 'subscription_options' ] );
		} );

		it( 'calls updateSettings with the staged subscription_options payload on onSave', async () => {
			updateSettings.mockResolvedValue( {} );
			await renderAndWait();

			const payload = {
				subscription_options: {
					invitation: 'I',
					welcome: 'W',
					comment_follow: 'CF',
					subscribe_modal_heading: 'Submitted heading',
				},
			};

			act( () => {
				subscribeModalProps.current.onChange( payload );
			} );

			await waitFor( () => {
				expect( subscribeModalProps.current.hasChanges ).toBe( true );
			} );

			await act( async () => {
				subscribeModalProps.current.onSave();
			} );

			expect( updateSettings ).toHaveBeenCalledWith( payload );
		} );

		it( 'clears hasChanges back to false after updateSettings resolves', async () => {
			updateSettings.mockResolvedValue( {} );
			await renderAndWait();

			act( () => {
				subscribeModalProps.current.onChange( {
					subscription_options: {
						invitation: 'I',
						welcome: 'W',
						comment_follow: 'CF',
						subscribe_modal_heading: 'Another heading',
					},
				} );
			} );

			await waitFor( () => {
				expect( subscribeModalProps.current.hasChanges ).toBe( true );
			} );

			await act( async () => {
				subscribeModalProps.current.onSave();
			} );

			await waitFor( () => {
				expect( subscribeModalProps.current.hasChanges ).toBe( false );
			} );
			expect( subscribeModalProps.current.isSaving ).toBe( false );
		} );
	} );
} );
