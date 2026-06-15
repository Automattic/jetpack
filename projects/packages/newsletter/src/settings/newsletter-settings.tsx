/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Disabled, Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Notice, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { fetchSettings, updateSettings } from './api';
import { getNewsletterScriptData } from './script-data';
import {
	EmailContentSection,
	EmailBylineSection,
	EmailDefaultsSection,
	EmailSenderSettingsSection,
	EmailReplyToSettingsSection,
	LegacySubscriptionsSection,
	NewsletterCategoriesSection,
	NewsletterSection,
	PaidNewsletterSection,
	SubscribeModalSection,
	SubscriptionsSection,
	WelcomeEmailSection,
} from './sections';
import type { NewsletterSettings } from './types';

/**
 * Normalize settings from API response.
 *
 * @param settings - Raw settings from API.
 * @return Normalized settings.
 */
function normalizeSettings( settings: Record< string, unknown > ): NewsletterSettings {
	return {
		...( settings as NewsletterSettings ),
		wpcom_newsletter_categories: ( ( settings.wpcom_newsletter_categories as number[] ) || [] ).map(
			String
		),
		// Ensure wpcom_subscription_emails_use_excerpt is a string ('0' or '1').
		wpcom_subscription_emails_use_excerpt: String(
			Number( settings.wpcom_subscription_emails_use_excerpt ) || 0
		),
	};
}

// Module-level cache of the last resolved settings. The modernized dashboard
// renders this body inside a `Tabs.Panel` that unmounts when the visitor
// switches to the Subscribers tab and remounts on return, so without a cache
// every revisit re-initialized `isLoading` to true and flashed the full-page
// spinner while re-fetching. Seeding initial state from this cache lets repeat
// mounts paint the settings immediately; only the genuine first load (empty
// cache) shows the spinner. The mount effect still re-fetches in the
// background to refresh the cache, so a returning visitor sees current values
// without the flash.
let cachedSettings: NewsletterSettings | null = null;

// Module-level cache of the last *persisted* settings — the saved baseline,
// as opposed to `cachedSettings` above which mirrors the optimistic (possibly
// unsaved) `data`. Kept in sync on fetch and after every successful save, and
// module-cached for the same reason: so a remount on tab-return knows the
// saved state immediately instead of treating it as unknown until the
// background refetch resolves. Consumed by the Subscriptions section to gate
// each placement's "Preview and edit" link on whether that placement is
// enabled *in the saved state* (an unsaved toggle previews nothing).
let cachedSavedSettings: NewsletterSettings | null = null;

/**
 * Test-only: clear the module-level settings caches so each test starts cold.
 * The caches deliberately outlive any single component instance (that's the
 * whole point — they survive the tab unmount/remount), which also means they
 * leak across tests in a file. Call this in `beforeEach` to keep cold-cache
 * assertions order-independent.
 */
export function __resetNewsletterSettingsCacheForTests(): void {
	cachedSettings = null;
	cachedSavedSettings = null;
}

export type NewsletterSettingsBodyProps = {
	/**
	 * Whether the active user has a connected WordPress.com owner account.
	 * When false, the body shows a connect notice and disables the form.
	 * Defaults to true so the new wp-build chassis — which doesn't pull in
	 * the SCSS-laden `@automattic/jetpack-connection` package just to read
	 * this — gets a working form by default.
	 */
	hasConnectedOwner?: boolean;
	/**
	 * URL to send the user to when they need to connect their account. Only
	 * surfaced when `hasConnectedOwner` is false. Optional because the
	 * default-true case never reads it.
	 */
	connectUrl?: string;
	/**
	 * When true, render the modernized IA (Paid first, placement-card grid
	 * inside Subscriptions, split-out Email defaults card, dropped master
	 * toggle). Defaults to false so the legacy
	 * `wp-admin/admin.php?page=jetpack-newsletter` surface — which mounts
	 * this body without the modernization flag — keeps its pre-modernization
	 * composition (master `NewsletterSection`, flat
	 * `LegacySubscriptionsSection`, trunk's section order). Both legacy
	 * branches retire together with the legacy chrome in #48613.
	 */
	isModernized?: boolean;
};

/**
 * Newsletter settings body — every section, every save handler, no chrome.
 *
 * Lifted out of the legacy `NewsletterSettingsApp` (which still wraps this
 * with `AdminPage` / `Container` / `Col` for the standalone wp-admin route)
 * so the modernized dashboard can mount the same body inside its
 * `Tabs.Panel` without dragging the SCSS-laden chrome packages
 * (`@automattic/jetpack-components`, `@automattic/jetpack-connection`)
 * through the wp-build pipeline. The 9 sections themselves stay
 * byte-for-byte identical.
 *
 * Snackbar dispatch goes straight to `@wordpress/notices`'s
 * `noticesStore` — the wp-build polyfills already render a `SnackbarList`
 * for us, and the legacy app wraps the body with its own `<GlobalNotices />`
 * surface, so both paths see the same snackbars without a shared rendering
 * primitive.
 *
 * @param props                   - Component props.
 * @param props.hasConnectedOwner - Whether the active user has a connected WordPress.com owner account.
 * @param props.connectUrl        - URL the user is sent to when they need to connect.
 * @param props.isModernized      - When true, render the modernized IA; defaults to false (legacy layout).
 * @return The settings body.
 */
export function NewsletterSettingsBody( {
	hasConnectedOwner = true,
	connectUrl,
	isModernized = false,
}: NewsletterSettingsBodyProps ): JSX.Element | null {
	// Seed from the module cache so a remount (e.g. returning to the Settings
	// tab) paints immediately instead of flashing the full-page spinner.
	const [ data, setData ] = useState< NewsletterSettings | null >( () => cachedSettings );
	// Last persisted settings (saved baseline), seeded from the module cache so a
	// remount knows the saved state without waiting on the background refetch.
	const [ savedData, setSavedData ] = useState< NewsletterSettings | null >(
		() => cachedSavedSettings
	);
	const [ isLoading, setIsLoading ] = useState( () => ! cachedSettings );
	const [ error, setError ] = useState< string | null >( null );

	// Subscription settings state (for manual save).
	const [ subscriptionChanges, setSubscriptionChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSubscriptions, setIsSavingSubscriptions ] = useState( false );

	// Sender name state (for manual save).
	const [ senderNameChanges, setSenderNameChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSenderName, setIsSavingSenderName ] = useState( false );

	// Newsletter categories state (for manual save).
	const [ newsletterCategoriesChanges, setNewsletterCategoriesChanges ] = useState<
		Partial< NewsletterSettings >
	>( {} );
	const [ isSavingNewsletterCategories, setIsSavingNewsletterCategories ] = useState( false );

	// Welcome email state (for manual save).
	const [ welcomeEmailChanges, setWelcomeEmailChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingWelcomeEmail, setIsSavingWelcomeEmail ] = useState( false );

	// Subscribe modal heading state (for manual save).
	const [ subscribeModalChanges, setSubscribeModalChanges ] = useState<
		Partial< NewsletterSettings >
	>( {} );
	const [ isSavingSubscribeModal, setIsSavingSubscribeModal ] = useState( false );

	// Get newsletter script data.
	const newsletterScriptData = useMemo( () => getNewsletterScriptData(), [] );

	// Snackbar notices via core data — `type: 'snackbar'` matches what the
	// legacy `useGlobalNotices` defaulted to, so both legacy and modernized
	// surfaces render the same snackbars.
	const { createNotice } = useDispatch( noticesStore );
	const createSuccessNotice = useCallback(
		( content: string ) => createNotice( 'success', content, { type: 'snackbar' } ),
		[ createNotice ]
	);
	const createErrorNotice = useCallback(
		( content: string ) =>
			createNotice( 'error', content, { type: 'snackbar', explicitDismiss: true } ),
		[ createNotice ]
	);

	// Get site type for analytics.
	const siteType = useMemo( () => getSiteType(), [] );

	// Initialize analytics with user data.
	useEffect( () => {
		const tracksUserData = newsletterScriptData?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [ newsletterScriptData ] );

	// Load settings on mount. When the cache is already populated (a remount)
	// this refetch runs in the background to refresh values without a spinner —
	// `isLoading` is only true on the genuine first load.
	useEffect( () => {
		fetchSettings()
			.then( ( settings: Record< string, unknown > ) => {
				const normalized = normalizeSettings( settings );
				setData( normalized );
				// Server truth on load is both the optimistic value and the saved baseline.
				setSavedData( normalized );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter settings load error:', err );
				// Only surface a blocking error when there's no cached data to
				// fall back on; a background refresh failure shouldn't blank a
				// page that's already rendering.
				if ( ! cachedSettings ) {
					setError( err.message || __( 'Failed to load settings', 'jetpack-newsletter' ) );
				}
				setIsLoading( false );
			} );
	}, [] );

	// Keep the module cache in sync with local state so optimistic edits,
	// saves, and reverts all carry over to the next mount — a returning visitor
	// sees their latest values, not a pre-save snapshot.
	//
	// Known caveat (low severity): this mirrors the *optimistic* `data`, so a
	// staged-but-unsaved edit briefly survives a tab switch — on remount the
	// visitor sees the un-persisted value while the per-section `*Changes` state
	// has reset to `{}` (no "unsaved changes" affordance), until the background
	// refetch overwrites it with the server value. The end state is correct
	// (server wins) and unsaved edits were already discarded on unmount pre-cache,
	// so this isn't a regression. The structural fix is a persisted saved-baseline
	// to reconcile against on remount (see the stacked preview-link PR's
	// `savedData`); tracked as a follow-up.
	useEffect( () => {
		if ( data ) {
			cachedSettings = data;
		}
	}, [ data ] );

	// Mirror the saved baseline to the module cache so it, too, survives a
	// remount (parallel to `cachedSettings` above, but for persisted values).
	useEffect( () => {
		if ( savedData ) {
			cachedSavedSettings = savedData;
		}
	}, [ savedData ] );

	// Handle auto-save for newsletter toggle and email settings.
	const handleAutoSave = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Track setting changes for analytics.
			for ( const key of Object.keys( updates ) as Array< keyof NewsletterSettings > ) {
				const newValue = updates[ key ];
				const oldValue = data[ key ];

				// Skip if value hasn't changed.
				if ( newValue === oldValue ) {
					continue;
				}

				// Track based on value type — no manual lists to maintain.
				if ( typeof newValue === 'boolean' ) {
					analytics.tracks.recordEvent( 'jetpack_newsletter_setting_toggle', {
						site_type: siteType,
						setting: String( key ),
						enabled: newValue,
					} );
				} else if ( typeof newValue === 'string' ) {
					analytics.tracks.recordEvent( 'jetpack_newsletter_setting_change', {
						site_type: siteType,
						setting: String( key ),
						value: newValue,
					} );
				}
			}

			// Update local state optimistically.
			setData( prev => ( { ...prev, ...updates } ) );

			// Save to backend.
			updateSettings( updates )
				.then( () => {
					// Advance the saved baseline now that these values are persisted.
					setSavedData( prev => ( { ...prev, ...updates } ) );
					createSuccessNotice( __( 'Settings saved', 'jetpack-newsletter' ) );
				} )
				.catch( ( err: Error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Newsletter settings auto-save error:', err );
					createErrorNotice( err.message || __( 'Failed to save settings', 'jetpack-newsletter' ) );
					// Revert optimistic update on error.
					setData( data );
				} );
		},
		[ createErrorNotice, createSuccessNotice, data, siteType ]
	);

	// Handle sender name changes (staged, not auto-saved).
	const handleSenderNameChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save).
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state.
		setSenderNameChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save sender name.
	const saveSenderName = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSenderName( true );

		updateSettings( senderNameChanges )
			.then( () => {
				setSavedData( prev => ( { ...prev, ...senderNameChanges } ) );
				setSenderNameChanges( {} );
				createSuccessNotice( __( 'Sender name saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter sender name save error:', err );
				createErrorNotice(
					err.message || __( 'Failed to save sender name', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingSenderName( false );
			} );
	}, [ createErrorNotice, createSuccessNotice, senderNameChanges, data ] );

	// Handle subscription settings changes (staged, not auto-saved).
	const handleSubscriptionChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save).
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state.
		setSubscriptionChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save subscription settings.
	const saveSubscriptionSettings = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSubscriptions( true );

		updateSettings( subscriptionChanges )
			.then( () => {
				// Advance the saved baseline so each placement's "Preview and edit"
				// link reflects the just-saved enabled state.
				setSavedData( prev => ( { ...prev, ...subscriptionChanges } ) );
				setSubscriptionChanges( {} );
				createSuccessNotice( __( 'Settings saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter subscription settings save error:', err );
				createErrorNotice(
					err.message || __( 'Failed to save subscription settings', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingSubscriptions( false );
			} );
	}, [ createErrorNotice, createSuccessNotice, subscriptionChanges, data ] );

	// Handle newsletter categories changes (staged, not auto-saved).
	const handleNewsletterCategoriesChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			// Update local state immediately (like auto-save).
			setData( prev => ( { ...prev, ...updates } ) );
			// Track changes for save button state.
			setNewsletterCategoriesChanges( prev => ( { ...prev, ...updates } ) );
		},
		[]
	);

	// Save newsletter categories settings.
	const saveNewsletterCategories = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingNewsletterCategories( true );

		// Convert categories from strings to numbers for API.
		const apiUpdates: Record< string, unknown > = { ...newsletterCategoriesChanges };

		// Only include categories if they exist AND are not empty.
		if (
			apiUpdates.wpcom_newsletter_categories &&
			Array.isArray( apiUpdates.wpcom_newsletter_categories )
		) {
			if ( ( apiUpdates.wpcom_newsletter_categories as string[] ).length > 0 ) {
				apiUpdates.wpcom_newsletter_categories = (
					apiUpdates.wpcom_newsletter_categories as string[]
				 ).map( Number );
			} else {
				// Remove empty categories from the update payload to avoid API error.
				delete apiUpdates.wpcom_newsletter_categories;
			}
		}

		updateSettings( apiUpdates )
			.then( () => {
				// Merge the staged (string) values so the baseline mirrors `data`'s shape.
				setSavedData( prev => ( { ...prev, ...newsletterCategoriesChanges } ) );
				setNewsletterCategoriesChanges( {} );
				createSuccessNotice( __( 'Newsletter categories saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter categories save error:', err );
				createErrorNotice(
					err.message || __( 'Failed to save newsletter categories', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingNewsletterCategories( false );
			} );
	}, [ createErrorNotice, createSuccessNotice, newsletterCategoriesChanges, data ] );

	// Handle welcome email changes (staged, not auto-saved).
	const handleWelcomeEmailChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save).
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state.
		setWelcomeEmailChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save welcome email settings.
	const saveWelcomeEmail = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingWelcomeEmail( true );

		updateSettings( welcomeEmailChanges )
			.then( () => {
				setSavedData( prev => ( { ...prev, ...welcomeEmailChanges } ) );
				setWelcomeEmailChanges( {} );
				createSuccessNotice( __( 'Welcome email message saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter welcome email save error:', err );
				createErrorNotice(
					err.message || __( 'Failed to save welcome email message', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingWelcomeEmail( false );
			} );
	}, [ createErrorNotice, createSuccessNotice, welcomeEmailChanges, data ] );

	// Handle subscribe modal heading changes (staged, not auto-saved).
	const handleSubscribeModalChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		setData( prev => ( { ...prev, ...updates } ) );
		setSubscribeModalChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save subscribe modal heading.
	const saveSubscribeModal = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSubscribeModal( true );

		updateSettings( subscribeModalChanges )
			.then( () => {
				setSavedData( prev => ( { ...prev, ...subscribeModalChanges } ) );
				setSubscribeModalChanges( {} );
				createSuccessNotice( __( 'Subscribe modal heading saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter subscribe modal save error:', err );
				createErrorNotice(
					err.message || __( 'Failed to save subscribe modal heading', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingSubscribeModal( false );
			} );
	}, [ createErrorNotice, createSuccessNotice, subscribeModalChanges, data ] );

	if ( isLoading ) {
		return (
			<div className="newsletter-settings">
				<Spinner />
			</div>
		);
	}

	if ( error ) {
		return (
			<div className="newsletter-settings newsletter-settings--error">
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			</div>
		);
	}

	if ( ! data ) {
		return null;
	}

	const hasSubscriptionChanges = Object.keys( subscriptionChanges ).length > 0;
	const hasSenderNameChanges = Object.keys( senderNameChanges ).length > 0;
	const hasNewsletterCategoriesChanges = Object.keys( newsletterCategoriesChanges ).length > 0;
	const hasWelcomeEmailChanges = Object.keys( welcomeEmailChanges ).length > 0;
	const hasSubscribeModalChanges = Object.keys( subscribeModalChanges ).length > 0;

	return (
		<>
			{ ! hasConnectedOwner && (
				<div className="newsletter-settings-connect-notice">
					<Notice.Root intent="warning">
						<Notice.Description>
							{ createInterpolateElement(
								__(
									'Connect your WordPress.com account to enable and set up your newsletter. <a>Connect now</a>',
									'jetpack-newsletter'
								),
								{
									a: connectUrl ? <a href={ connectUrl } /> : <span />,
								}
							) }
						</Notice.Description>
					</Notice.Root>
				</div>
			) }
			<Disabled
				isDisabled={ ! hasConnectedOwner }
				className={ ! hasConnectedOwner ? 'newsletter-settings-disabled' : undefined }
			>
				<Stack gap="xl" direction="column" className="newsletter-settings">
					{ isModernized ? (
						<Disabled isDisabled={ ! data.subscriptions }>
							<Stack gap="xl" direction="column">
								<PaidNewsletterSection
									isNewsletterEnabled={ data.subscriptions }
									hasActivePlan={ data.newsletter_has_active_plan }
								/>

								<EmailDefaultsSection
									data={ data }
									onChange={ handleAutoSave }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<SubscriptionsSection
									data={ data }
									savedData={ savedData }
									onChange={ handleSubscriptionChange }
									onSave={ saveSubscriptionSettings }
									isSaving={ isSavingSubscriptions }
									hasChanges={ hasSubscriptionChanges }
									changedKeys={ Object.keys( subscriptionChanges ) }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<EmailContentSection
									data={ data }
									onChange={ handleAutoSave }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<EmailBylineSection
									data={ data }
									onChange={ handleAutoSave }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<EmailSenderSettingsSection
									data={ data }
									onChange={ handleSenderNameChange }
									onSave={ saveSenderName }
									isSaving={ isSavingSenderName }
									hasChanges={ hasSenderNameChanges }
									changedKeys={ Object.keys( senderNameChanges ) }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<EmailReplyToSettingsSection
									data={ data }
									onChange={ handleAutoSave }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<WelcomeEmailSection
									data={ data }
									onChange={ handleWelcomeEmailChange }
									onSave={ saveWelcomeEmail }
									isSaving={ isSavingWelcomeEmail }
									hasChanges={ hasWelcomeEmailChanges }
									changedKeys={ Object.keys( welcomeEmailChanges ) }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<SubscribeModalSection
									data={ data }
									onChange={ handleSubscribeModalChange }
									onSave={ saveSubscribeModal }
									isSaving={ isSavingSubscribeModal }
									hasChanges={ hasSubscribeModalChanges }
									changedKeys={ Object.keys( subscribeModalChanges ) }
									isNewsletterEnabled={ data.subscriptions }
								/>

								<NewsletterCategoriesSection
									data={ data }
									onChange={ handleNewsletterCategoriesChange }
									onSave={ saveNewsletterCategories }
									isSaving={ isSavingNewsletterCategories }
									hasChanges={ hasNewsletterCategoriesChanges }
									changedKeys={ Object.keys( newsletterCategoriesChanges ) }
									isNewsletterEnabled={ data.subscriptions }
								/>
							</Stack>
						</Disabled>
					) : (
						<>
							<NewsletterSection data={ data } onChange={ handleAutoSave } />

							<Disabled isDisabled={ ! data.subscriptions }>
								<Stack gap="xl" direction="column">
									<LegacySubscriptionsSection
										data={ data }
										onChange={ handleSubscriptionChange }
										onSave={ saveSubscriptionSettings }
										isSaving={ isSavingSubscriptions }
										hasChanges={ hasSubscriptionChanges }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<PaidNewsletterSection
										isNewsletterEnabled={ data.subscriptions }
										hasActivePlan={ data.newsletter_has_active_plan }
									/>

									<NewsletterCategoriesSection
										data={ data }
										onChange={ handleNewsletterCategoriesChange }
										onSave={ saveNewsletterCategories }
										isSaving={ isSavingNewsletterCategories }
										hasChanges={ hasNewsletterCategoriesChanges }
										changedKeys={ Object.keys( newsletterCategoriesChanges ) }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<EmailContentSection
										data={ data }
										onChange={ handleAutoSave }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<EmailBylineSection
										data={ data }
										onChange={ handleAutoSave }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<EmailSenderSettingsSection
										data={ data }
										onChange={ handleSenderNameChange }
										onSave={ saveSenderName }
										isSaving={ isSavingSenderName }
										hasChanges={ hasSenderNameChanges }
										changedKeys={ Object.keys( senderNameChanges ) }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<EmailReplyToSettingsSection
										data={ data }
										onChange={ handleAutoSave }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<WelcomeEmailSection
										data={ data }
										onChange={ handleWelcomeEmailChange }
										onSave={ saveWelcomeEmail }
										isSaving={ isSavingWelcomeEmail }
										hasChanges={ hasWelcomeEmailChanges }
										changedKeys={ Object.keys( welcomeEmailChanges ) }
										isNewsletterEnabled={ data.subscriptions }
									/>

									<SubscribeModalSection
										data={ data }
										onChange={ handleSubscribeModalChange }
										onSave={ saveSubscribeModal }
										isSaving={ isSavingSubscribeModal }
										hasChanges={ hasSubscribeModalChanges }
										changedKeys={ Object.keys( subscribeModalChanges ) }
										isNewsletterEnabled={ data.subscriptions }
									/>
								</Stack>
							</Disabled>
						</>
					) }
				</Stack>
			</Disabled>
		</>
	);
}
