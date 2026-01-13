/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { Notice } from '@wordpress/components';
import { createRoot, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { Header } from './components/header';
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

	// Get settings from PHP
	const jetpackSettings = (
		window as Window & { jetpackNewsletterSettings?: JetpackNewsletterSettings }
	 ).jetpackNewsletterSettings;

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
				setData( settings as NewsletterSettings );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || __( 'Failed to load settings', 'jetpack-newsletter' ) );
				setIsLoading( false );
			} );
	}, [ jetpackSettings?.restApiRoot, jetpackSettings?.restApiNonce ] );

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

	return (
		<div className="newsletter-settings">
			<Header />
			{ /* Settings sections will be added in subsequent PRs */ }
		</div>
	);
}

const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
