/**
 * External dependencies
 */
import { GlobalNotices, useGlobalNotices } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { createRoot, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { fetchSettings, updateSettings } from './api';
import { Header } from './components/header';
import {
	EmailContentSection,
	EmailBylineSection,
	EmailSenderSettingsSection,
	EmailReplyToSettingsSection,
	NewsletterSection,
	NewsletterCategoriesSection,
	PaidNewsletterSection,
	SubscriptionsSection,
	WelcomeEmailSection,
} from './sections';
import type { NewsletterSettings, JetpackNewsletterSettings } from './types';
import './style.scss';

/**
 * Normalize settings from API response
 *
 * @param {Record<string, unknown>} settings - Raw settings from API
 * @return {NewsletterSettings} Normalized settings
 */
function normalizeSettings( settings: Record< string, unknown > ): NewsletterSettings {
	return {
		...( settings as NewsletterSettings ),
		wpcom_newsletter_categories: ( ( settings.wpcom_newsletter_categories as number[] ) || [] ).map(
			String
		),
		// Ensure wpcom_subscription_emails_use_excerpt is a string ('0' or '1')
		wpcom_subscription_emails_use_excerpt: String(
			Number( settings.wpcom_subscription_emails_use_excerpt ) || 0
		),
	};
}

/**
 * Newsletter Settings App
 *
 * @return {JSX.Element | null} The newsletter settings component or null.
 */
function NewsletterSettingsApp(): JSX.Element | null {
	const [ data, setData ] = useState< NewsletterSettings | null >( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	// Subscription settings state (for manual save)
	const [ subscriptionChanges, setSubscriptionChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSubscriptions, setIsSavingSubscriptions ] = useState( false );

	// Sender name state (for manual save)
	const [ senderNameChanges, setSenderNameChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSenderName, setIsSavingSenderName ] = useState( false );

	// Newsletter categories state (for manual save)
	const [ newsletterCategoriesChanges, setNewsletterCategoriesChanges ] = useState<
		Partial< NewsletterSettings >
	>( {} );
	const [ isSavingNewsletterCategories, setIsSavingNewsletterCategories ] = useState( false );

	// Welcome email state (for manual save)
	const [ welcomeEmailChanges, setWelcomeEmailChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingWelcomeEmail, setIsSavingWelcomeEmail ] = useState( false );

	// Get settings from PHP
	const jetpackSettings = (
		window as Window & { jetpackNewsletterSettings?: JetpackNewsletterSettings }
	 ).jetpackNewsletterSettings;

	// Global notices for success messages
	const { createSuccessNotice } = useGlobalNotices();

	// Load settings on mount
	useEffect( () => {
		fetchSettings( jetpackSettings )
			.then( ( settings: Record< string, unknown > ) => {
				setData( normalizeSettings( settings ) );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter settings load error:', err );
				setError( err.message || __( 'Failed to load settings', 'jetpack-newsletter' ) );
				setIsLoading( false );
			} );
	}, [ jetpackSettings ] );

	// Handle auto-save for newsletter toggle and email settings
	const handleAutoSave = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state optimistically
			setData( prev => ( { ...prev, ...updates } ) );

			// Save to backend
			updateSettings( updates, jetpackSettings )
				.then( () => {
					setError( null );
					createSuccessNotice( __( 'Settings saved', 'jetpack-newsletter' ) );
				} )
				.catch( ( err: Error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Newsletter settings auto-save error:', err );
					setError( err.message || __( 'Failed to save settings', 'jetpack-newsletter' ) );
					// Revert optimistic update on error
					setData( data );
				} );
		},
		[ createSuccessNotice, data, jetpackSettings ]
	);

	// Handle sender name changes (staged, not auto-saved)
	const handleSenderNameChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save)
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state
		setSenderNameChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save sender name
	const saveSenderName = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSenderName( true );
		setError( null );

		updateSettings( senderNameChanges, jetpackSettings )
			.then( () => {
				setError( null );
				setSenderNameChanges( {} );
				createSuccessNotice( __( 'Sender name saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter sender name save error:', err );
				setError( err.message || __( 'Failed to save sender name', 'jetpack-newsletter' ) );
			} )
			.finally( () => {
				setIsSavingSenderName( false );
			} );
	}, [ createSuccessNotice, senderNameChanges, data, jetpackSettings ] );

	// Handle subscription settings changes (staged, not auto-saved)
	const handleSubscriptionChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save)
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state
		setSubscriptionChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save subscription settings
	const saveSubscriptionSettings = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSubscriptions( true );
		setError( null );

		updateSettings( subscriptionChanges, jetpackSettings )
			.then( () => {
				setError( null );
				setSubscriptionChanges( {} );
				createSuccessNotice( __( 'Settings saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter subscription settings save error:', err );
				setError(
					err.message || __( 'Failed to save subscription settings', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingSubscriptions( false );
			} );
	}, [ createSuccessNotice, subscriptionChanges, data, jetpackSettings ] );

	// Handle newsletter categories changes (staged, not auto-saved)
	const handleNewsletterCategoriesChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			// Update local state immediately (like auto-save)
			setData( prev => ( { ...prev, ...updates } ) );
			// Track changes for save button state
			setNewsletterCategoriesChanges( prev => ( { ...prev, ...updates } ) );
		},
		[]
	);

	// Save newsletter categories settings
	const saveNewsletterCategories = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingNewsletterCategories( true );
		setError( null );

		// Convert categories from strings to numbers for API
		const apiUpdates: Record< string, unknown > = { ...newsletterCategoriesChanges };

		// Only include categories if they exist AND are not empty
		if (
			apiUpdates.wpcom_newsletter_categories &&
			Array.isArray( apiUpdates.wpcom_newsletter_categories )
		) {
			if ( ( apiUpdates.wpcom_newsletter_categories as string[] ).length > 0 ) {
				apiUpdates.wpcom_newsletter_categories = (
					apiUpdates.wpcom_newsletter_categories as string[]
				 ).map( Number );
			} else {
				// Remove empty categories from the update payload to avoid API error
				delete apiUpdates.wpcom_newsletter_categories;
			}
		}

		updateSettings( apiUpdates, jetpackSettings )
			.then( () => {
				setError( null );
				setNewsletterCategoriesChanges( {} );
				createSuccessNotice( __( 'Newsletter categories saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter categories save error:', err );
				setError(
					err.message || __( 'Failed to save newsletter categories', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingNewsletterCategories( false );
			} );
	}, [ createSuccessNotice, newsletterCategoriesChanges, data, jetpackSettings ] );

	// Handle welcome email changes (staged, not auto-saved)
	const handleWelcomeEmailChange = useCallback( ( updates: Partial< NewsletterSettings > ) => {
		// Update local state immediately (like auto-save)
		setData( prev => ( { ...prev, ...updates } ) );
		// Track changes for save button state
		setWelcomeEmailChanges( prev => ( { ...prev, ...updates } ) );
	}, [] );

	// Save welcome email settings
	const saveWelcomeEmail = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingWelcomeEmail( true );
		setError( null );

		updateSettings( welcomeEmailChanges, jetpackSettings )
			.then( () => {
				setError( null );
				setWelcomeEmailChanges( {} );
				createSuccessNotice( __( 'Welcome email message saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Newsletter welcome email save error:', err );
				setError(
					err.message || __( 'Failed to save welcome email message', 'jetpack-newsletter' )
				);
			} )
			.finally( () => {
				setIsSavingWelcomeEmail( false );
			} );
	}, [ createSuccessNotice, welcomeEmailChanges, data, jetpackSettings ] );

	if ( isLoading ) {
		return (
			<div className="newsletter-settings">
				<p>{ __( 'Loading newsletter settings…', 'jetpack-newsletter' ) }</p>
			</div>
		);
	}

	if ( error ) {
		return (
			<div className="newsletter-settings newsletter-settings--error">
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
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

	return (
		<div className="newsletter-settings">
			<Header />

			{ ! jetpackSettings?.isWpcomSimple && (
				<NewsletterSection
					data={ data }
					jetpackSettings={ jetpackSettings }
					onChange={ handleAutoSave }
				/>
			) }

			<SubscriptionsSection
				data={ data }
				jetpackSettings={ jetpackSettings }
				onChange={ handleSubscriptionChange }
				onSave={ saveSubscriptionSettings }
				isSaving={ isSavingSubscriptions }
				hasChanges={ hasSubscriptionChanges }
				isNewsletterEnabled={ data.subscriptions }
			/>

			<PaidNewsletterSection
				jetpackSettings={ jetpackSettings }
				isNewsletterEnabled={ data.subscriptions }
			/>

			<NewsletterCategoriesSection
				data={ data }
				onChange={ handleNewsletterCategoriesChange }
				onSave={ saveNewsletterCategories }
				isSaving={ isSavingNewsletterCategories }
				hasChanges={ hasNewsletterCategoriesChanges }
				jetpackSettings={ jetpackSettings }
				onError={ setError }
				isNewsletterEnabled={ data.subscriptions }
			/>

			<EmailContentSection
				data={ data }
				onChange={ handleAutoSave }
				isSitePublic={ jetpackSettings?.isSitePublic ?? true }
				isNewsletterEnabled={ data.subscriptions }
			/>

			<EmailBylineSection
				data={ data }
				onChange={ handleAutoSave }
				jetpackSettings={ jetpackSettings }
				isNewsletterEnabled={ data.subscriptions }
			/>

			<EmailSenderSettingsSection
				data={ data }
				onChange={ handleSenderNameChange }
				onSave={ saveSenderName }
				isSaving={ isSavingSenderName }
				hasChanges={ hasSenderNameChanges }
				jetpackSettings={ jetpackSettings }
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
				isNewsletterEnabled={ data.subscriptions }
			/>

			<GlobalNotices />
		</div>
	);
}

const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
