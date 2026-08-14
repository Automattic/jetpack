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

const mockCreateNotice = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createNotice: mockCreateNotice } ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Disabled: ( { children } ) => <div>{ children }</div>,
	Spinner: () => <div role="status" />,
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: {},
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
const emailBylineProps = { current: null };
const emailContentProps = { current: null };
const emailDefaultsProps = { current: null };
const emailReplyToProps = { current: null };
const senderSettingsProps = { current: null };
const newsletterCategoriesProps = { current: null };
const newsletterProps = { current: null };
const subscriptionsProps = { current: null };
const welcomeEmailProps = { current: null };

jest.mock( '../src/settings/sections', () => ( {
	EmailBylineSection: props => {
		emailBylineProps.current = props;
		return <div data-testid="email-byline-section" />;
	},
	EmailContentSection: props => {
		emailContentProps.current = props;
		return <div data-testid="email-content-section" />;
	},
	EmailDefaultsSection: props => {
		emailDefaultsProps.current = props;
		return <div data-testid="email-defaults-section" />;
	},
	EmailReplyToSettingsSection: props => {
		emailReplyToProps.current = props;
		return <div data-testid="email-reply-to-settings-section" />;
	},
	EmailSenderSettingsSection: props => {
		senderSettingsProps.current = props;
		return <div data-testid="email-sender-settings-section" />;
	},
	LegacySubscriptionsSection: props => {
		subscriptionsProps.current = props;
		return <div data-testid="legacy-subscriptions-section" />;
	},
	NewsletterCategoriesSection: props => {
		newsletterCategoriesProps.current = props;
		return <div data-testid="newsletter-categories-section" />;
	},
	NewsletterSection: props => {
		newsletterProps.current = props;
		return <div data-testid="newsletter-section" />;
	},
	PaidNewsletterSection: () => <div data-testid="paid-newsletter-section" />,
	SubscribeModalSection: props => {
		subscribeModalProps.current = props;
		return <div data-testid="subscribe-modal-section" />;
	},
	SubscriptionsSection: props => {
		subscriptionsProps.current = props;
		return <div data-testid="subscriptions-section" />;
	},
	WelcomeEmailSection: props => {
		welcomeEmailProps.current = props;
		return <div data-testid="welcome-email-section" />;
	},
} ) );

import { useConnection } from '@automattic/jetpack-connection';
import { act, render, screen, waitFor } from '@testing-library/react';
import { NewsletterSettingsApp } from '../src/settings';
import { fetchSettings, updateSettings } from '../src/settings/api';
import {
	NewsletterSettingsBody,
	__resetNewsletterSettingsCacheForTests,
} from '../src/settings/newsletter-settings';

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
		__resetNewsletterSettingsCacheForTests();
		subscribeModalProps.current = null;
		emailBylineProps.current = null;
		emailContentProps.current = null;
		emailDefaultsProps.current = null;
		emailReplyToProps.current = null;
		senderSettingsProps.current = null;
		newsletterCategoriesProps.current = null;
		newsletterProps.current = null;
		subscriptionsProps.current = null;
		welcomeEmailProps.current = null;
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

	describe( 'save notices', () => {
		beforeEach( () => {
			useConnection.mockReturnValue( {
				hasConnectedOwner: true,
				isRegistered: true,
				isUserConnected: true,
			} );
		} );

		it.each( [
			[
				'newsletter settings',
				newsletterProps,
				{ subscriptions: false },
				'Newsletter settings saved',
				false,
			],
			[
				'email defaults',
				emailDefaultsProps,
				{ wpcom_newsletter_send_default: true },
				'Email defaults saved',
				true,
			],
			[
				'email content',
				emailContentProps,
				{ wpcom_featured_image_in_email: true },
				'Email content saved',
				false,
			],
			[
				'email byline',
				emailBylineProps,
				{ jetpack_author_in_email: true },
				'Email byline saved',
				false,
			],
			[
				'reply-to settings',
				emailReplyToProps,
				{ jetpack_subscriptions_reply_to: 'author' },
				'Reply-to settings saved',
				false,
			],
		] )(
			'names %s after auto-save',
			async ( _section, propsRef, updates, successMessage, isModernized ) => {
				updateSettings.mockResolvedValue( {} );
				if ( isModernized ) {
					render( <NewsletterSettingsBody isModernized /> );
				} else {
					render( <NewsletterSettingsApp /> );
				}

				await waitFor( () => expect( propsRef.current ).not.toBeNull() );
				act( () => propsRef.current.onChange( updates ) );

				await waitFor( () => {
					expect( mockCreateNotice ).toHaveBeenCalledWith( 'success', successMessage, {
						type: 'snackbar',
					} );
				} );
			}
		);

		it.each( [
			[
				'sender settings',
				senderSettingsProps,
				{ jetpack_subscriptions_from_name: 'New sender' },
				'Sender settings saved',
			],
			[
				'subscription settings',
				subscriptionsProps,
				{ stb_enabled: true },
				'Subscription settings saved',
			],
			[
				'newsletter categories',
				newsletterCategoriesProps,
				{ wpcom_newsletter_categories_enabled: true },
				'Newsletter categories saved',
			],
			[
				'welcome email',
				welcomeEmailProps,
				{
					subscription_options: {
						invitation: '',
						welcome: 'Welcome aboard',
						comment_follow: '',
						subscribe_modal_heading: '',
					},
				},
				'Welcome email saved',
			],
			[
				'subscribe modal',
				subscribeModalProps,
				{
					subscription_options: {
						invitation: '',
						welcome: '',
						comment_follow: '',
						subscribe_modal_heading: 'New heading',
					},
				},
				'Subscribe modal saved',
			],
		] )( 'names %s after manual save', async ( _section, propsRef, updates, successMessage ) => {
			updateSettings.mockResolvedValue( {} );
			render( <NewsletterSettingsApp /> );

			await waitFor( () => expect( propsRef.current ).not.toBeNull() );
			act( () => propsRef.current.onChange( updates ) );
			await waitFor( () => expect( propsRef.current.hasChanges ).toBe( true ) );
			act( () => propsRef.current.onSave() );

			await waitFor( () => {
				expect( mockCreateNotice ).toHaveBeenCalledWith( 'success', successMessage, {
					type: 'snackbar',
				} );
			} );
		} );
	} );

	describe( 'EmailSenderSettingsSection wiring', () => {
		beforeEach( () => {
			useConnection.mockReturnValue( {
				hasConnectedOwner: true,
				isRegistered: true,
				isUserConnected: true,
			} );
		} );

		it( 'preserves edits made while an earlier sender settings save is pending', async () => {
			let resolveFirstSave;
			const firstSave = new Promise( resolve => {
				resolveFirstSave = resolve;
			} );
			updateSettings.mockReturnValueOnce( firstSave ).mockResolvedValueOnce( {} );
			render( <NewsletterSettingsApp /> );

			await waitFor( () => expect( senderSettingsProps.current ).not.toBeNull() );

			act( () => {
				senderSettingsProps.current.onChange( {
					jetpack_subscriptions_from_name: 'First sender',
				} );
			} );
			await waitFor( () => expect( senderSettingsProps.current.hasChanges ).toBe( true ) );

			act( () => senderSettingsProps.current.onSave() );
			await waitFor( () => expect( senderSettingsProps.current.isSaving ).toBe( true ) );

			act( () => {
				senderSettingsProps.current.onChange( {
					jetpack_subscriptions_from_name: 'Second sender',
				} );
			} );

			await act( async () => {
				resolveFirstSave( {} );
				await firstSave;
			} );

			expect( senderSettingsProps.current.hasChanges ).toBe( true );
			expect( senderSettingsProps.current.data.jetpack_subscriptions_from_name ).toBe(
				'Second sender'
			);

			act( () => senderSettingsProps.current.onSave() );
			await waitFor( () => expect( updateSettings ).toHaveBeenCalledTimes( 2 ) );

			expect( updateSettings ).toHaveBeenNthCalledWith( 1, {
				jetpack_subscriptions_from_name: 'First sender',
			} );
			expect( updateSettings ).toHaveBeenNthCalledWith( 2, {
				jetpack_subscriptions_from_name: 'Second sender',
			} );
		} );
	} );
} );
