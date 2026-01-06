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
	EmailBylineSection,
	EmailContentSection,
	EmailReplyToSettingsSection,
	EmailSenderSettingsSection,
	NewsletterSection,
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

	// Sender name state (for manual save)
	const [ senderNameChanges, setSenderNameChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSenderName, setIsSavingSenderName ] = useState( false );

	// Snackbar notification state
	const [ snackbarMessage, setSnackbarMessage ] = useState< string | null >( null );

	// Get settings from PHP
	const jetpackSettings = (
		window as Window & { jetpackNewsletterSettings?: JetpackNewsletterSettings }
	 ).jetpackNewsletterSettings;

	// Callback to clear snackbar
	const clearSnackbar = useCallback( () => setSnackbarMessage( null ), [] );

	// Load settings on mount
	useEffect( () => {
		// Initialize the REST API with settings from PHP
		if ( jetpackSettings?.restApiRoot && jetpackSettings?.restApiNonce ) {
			restApi.setApiRoot( jetpackSettings.restApiRoot );
			restApi.setApiNonce( jetpackSettings.restApiNonce );
		}

		restApi
			.fetchSettings()
			.then( ( settings: Record< string, unknown > ) => {
				// Convert category IDs from numbers to strings
				const normalizedSettings: NewsletterSettings = {
					...( settings as NewsletterSettings ),
					// Ensure wpcom_subscription_emails_use_excerpt is a string ('0' or '1')
					wpcom_subscription_emails_use_excerpt: String(
						Number( settings.wpcom_subscription_emails_use_excerpt ) || 0
					),
				};
				setData( normalizedSettings );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || __( 'Failed to load settings', 'jetpack-newsletter' ) );
				setIsLoading( false );
			} );
	}, [ jetpackSettings?.restApiRoot, jetpackSettings?.restApiNonce ] );

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

	// Handle sender name changes (staged, not auto-saved)
	const handleSenderNameChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Merge updates into staged changes
			setSenderNameChanges( { ...senderNameChanges, ...updates } );
		},
		[ data, senderNameChanges ]
	);

	// Save sender name
	const saveSenderName = useCallback( () => {
		if ( ! data ) {
			return;
		}

		setIsSavingSenderName( true );
		setError( null );

		restApi
			.updateSettings( senderNameChanges )
			.then( () => {
				setData( { ...data, ...senderNameChanges } );
				setSenderNameChanges( {} );
				setSnackbarMessage( __( 'Sender name saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save sender name' );
			} )
			.finally( () => {
				setIsSavingSenderName( false );
			} );
	}, [ senderNameChanges, data ] );

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

	const hasSenderNameChanges = Object.keys( senderNameChanges ).length > 0;

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
				data={ { ...data, ...senderNameChanges } }
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

			{ snackbarMessage && <Snackbar onRemove={ clearSnackbar }>{ snackbarMessage }</Snackbar> }
		</div>
	);
}

const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
