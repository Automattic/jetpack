/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { Notice, Snackbar } from '@wordpress/components';
import { createRoot, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { Header } from './components/header';
import {
	EmailConfigurationSection,
	NewsletterSection,
	NewsletterCategoriesSection,
	PaidNewsletterSection,
	SubscriptionsSection,
} from './sections';
import type { NewsletterSettings, JetpackNewsletterSettings } from './types';
import './style.scss';

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
	const [ senderName, setSenderName ] = useState( '' );
	const [ isSavingSenderName, setIsSavingSenderName ] = useState( false );

	// Snackbar notification state
	const [ snackbarMessage, setSnackbarMessage ] = useState< string | null >( null );

	// Newsletter categories state (for manual save)
	const [ newsletterCategoriesChanges, setNewsletterCategoriesChanges ] = useState<
		Partial< NewsletterSettings >
	>( {} );
	const [ isSavingNewsletterCategories, setIsSavingNewsletterCategories ] = useState( false );

	// Get settings from PHP
	const jetpackSettings = (
		window as Window & { jetpackNewsletterSettings?: JetpackNewsletterSettings }
	 ).jetpackNewsletterSettings;

	// Callback to clear error
	const clearError = useCallback( () => setError( null ), [] );

	// Callback to clear snackbar
	const clearSnackbar = useCallback( () => setSnackbarMessage( null ), [] );

	// Callback for sender name input change
	const handleSenderNameChange = useCallback(
		( e: React.ChangeEvent< HTMLInputElement > ) => setSenderName( e.target.value ),
		[]
	);

	// Load settings on mount
	useEffect( () => {
		// Initialize the REST API with WordPress settings
		const wpApiSettings = ( window as Window & { wpApiSettings?: { root: string; nonce: string } } )
			.wpApiSettings;
		if ( wpApiSettings ) {
			restApi.setApiRoot( wpApiSettings.root );
			restApi.setApiNonce( wpApiSettings.nonce );
		}

		restApi
			.fetchSettings()
			.then( ( settings: Record< string, unknown > ) => {
				// Convert category IDs from numbers to strings
				const normalizedSettings: NewsletterSettings = {
					...( settings as NewsletterSettings ),
					wpcom_newsletter_categories: (
						( settings.wpcom_newsletter_categories as number[] ) || []
					).map( String ),
				};
				setData( normalizedSettings );
				setSenderName( normalizedSettings.jetpack_subscriptions_from_name || '' );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to load settings' );
				setIsLoading( false );
			} );
	}, [] );

	// Handle auto-save for newsletter toggle and email settings
	const handleAutoSave = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state optimistically
			setData( { ...data, ...updates } );

			// Save to backend
			restApi.updateSettings( updates ).catch( ( err: Error ) => {
				setError( err.message || 'Failed to save settings' );
				// Revert optimistic update on error
				setData( data );
			} );
		},
		[ data ]
	);

	// Handle subscription settings changes (staged, not auto-saved)
	const handleSubscriptionChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state
			setData( { ...data, ...updates } );

			// Track changes for save button
			setSubscriptionChanges( { ...subscriptionChanges, ...updates } );
		},
		[ data, subscriptionChanges ]
	);

	// Save subscription settings
	const saveSubscriptionSettings = useCallback( () => {
		setIsSavingSubscriptions( true );
		setError( null );

		restApi
			.updateSettings( subscriptionChanges )
			.then( () => {
				setSubscriptionChanges( {} );
				setSnackbarMessage( __( 'Settings saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save subscription settings' );
			} )
			.finally( () => {
				setIsSavingSubscriptions( false );
			} );
	}, [ subscriptionChanges ] );

	// Save sender name
	const saveSenderName = useCallback( () => {
		setIsSavingSenderName( true );
		setError( null );

		restApi
			.updateSettings( { jetpack_subscriptions_from_name: senderName } )
			.then( () => {
				if ( data ) {
					setData( { ...data, jetpack_subscriptions_from_name: senderName } );
				}
				setSnackbarMessage( __( 'Sender name saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save sender name' );
			} )
			.finally( () => {
				setIsSavingSenderName( false );
			} );
	}, [ senderName, data ] );

	// Handle newsletter categories changes (staged, not auto-saved)
	const handleNewsletterCategoriesChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state
			setData( { ...data, ...updates } );

			// Track changes for save button
			setNewsletterCategoriesChanges( { ...newsletterCategoriesChanges, ...updates } );
		},
		[ data, newsletterCategoriesChanges ]
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
		if ( apiUpdates.wpcom_newsletter_categories ) {
			apiUpdates.wpcom_newsletter_categories = (
				apiUpdates.wpcom_newsletter_categories as string[]
			 ).map( Number );
		}

		restApi
			.updateSettings( apiUpdates )
			.then( () => {
				setNewsletterCategoriesChanges( {} );
				setSnackbarMessage( __( 'Newsletter categories saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save newsletter categories' );
			} )
			.finally( () => {
				setIsSavingNewsletterCategories( false );
			} );
	}, [ newsletterCategoriesChanges, data ] );

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
	const hasSenderNameChanged = senderName !== ( data.jetpack_subscriptions_from_name || '' );
	const hasNewsletterCategoriesChanges = Object.keys( newsletterCategoriesChanges ).length > 0;

	return (
		<div className="newsletter-settings">
			<Header />

			{ error && (
				<Notice status="error" isDismissible onRemove={ clearError }>
					{ error }
				</Notice>
			) }

			<NewsletterSection
				data={ data }
				jetpackSettings={ jetpackSettings }
				onChange={ handleAutoSave }
			/>

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

			<EmailConfigurationSection
				data={ data }
				onChange={ handleAutoSave }
				jetpackSettings={ jetpackSettings }
				senderName={ senderName }
				onSenderNameChange={ handleSenderNameChange }
				onSenderNameSave={ saveSenderName }
				isSavingSenderName={ isSavingSenderName }
				hasSenderNameChanged={ hasSenderNameChanged }
				isNewsletterEnabled={ data.subscriptions }
			/>

			{ snackbarMessage && <Snackbar onRemove={ clearSnackbar }>{ snackbarMessage }</Snackbar> }
		</div>
	);
}

const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
