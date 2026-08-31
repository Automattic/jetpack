// The modernized Newsletter dashboard mounts `NewsletterSettingsBody` inside a
// `Tabs.Panel` that unmounts on tab switch and remounts on return. Without a
// cache that remount re-flashed the full-page spinner on every visit. These
// tests lock in the fix: the genuine first load shows a loading affordance,
// but a later mount (cache warm) paints the settings immediately.

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: jest.fn( () => 'jetpack' ),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '../src/settings/api', () => ( {
	fetchSettings: jest.fn(),
	updateSettings: jest.fn(),
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: jest.fn( () => ( {} ) ),
} ) );

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
	SubscribeModalSection: () => <div data-testid="subscribe-modal-section" />,
	SubscriptionsSection: () => <div data-testid="subscriptions-section" />,
	WelcomeEmailSection: () => <div data-testid="welcome-email-section" />,
} ) );

import { render, screen, waitFor } from '@testing-library/react';
import { fetchSettings } from '../src/settings/api';
import {
	NewsletterSettingsBody,
	__resetNewsletterSettingsCacheForTests,
} from '../src/settings/newsletter-settings';

const defaultSettings = {
	subscriptions: true,
	wpcom_subscription_emails_use_excerpt: 'full',
	wpcom_newsletter_categories: [],
	newsletter_has_active_plan: false,
};

// The full-page loading affordance is a bare `<Spinner />` with no section
// markup; "loaded" is the first section appearing.
const isShowingSpinner = () => screen.queryByTestId( 'newsletter-section' ) === null;

describe( 'NewsletterSettingsBody loading cache', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset the module-level cache so every test starts cold, regardless of
		// order — otherwise an earlier test that warms the cache would make the
		// "genuine first load" assertion below pass for the wrong reason.
		__resetNewsletterSettingsCacheForTests();
		// Resolve on a microtask so the synchronous initial render still shows
		// the loading state on a cold cache.
		fetchSettings.mockResolvedValue( defaultSettings );
	} );

	it( 'shows the loading affordance on the genuine first load', async () => {
		render( <NewsletterSettingsBody /> );

		// Cold render: spinner first, no section yet.
		expect( isShowingSpinner() ).toBe( true );

		await waitFor( () => {
			expect( screen.getByTestId( 'newsletter-section' ) ).toBeInTheDocument();
		} );
	} );

	it( 'does not flash the spinner on a later mount once settings are cached', async () => {
		// First mount warms the module cache.
		const view = render( <NewsletterSettingsBody /> );
		await waitFor( () => {
			expect( screen.getByTestId( 'newsletter-section' ) ).toBeInTheDocument();
		} );
		view.unmount();

		// Remount (e.g. returning to the Settings tab): the section is present
		// synchronously, with no spinner-only frame in between.
		render( <NewsletterSettingsBody /> );
		expect( isShowingSpinner() ).toBe( false );
		expect( screen.getByTestId( 'newsletter-section' ) ).toBeInTheDocument();

		// Let the background refresh settle so its state update doesn't leak
		// past the test as an unwrapped act() warning.
		await waitFor( () => {
			expect( fetchSettings ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
