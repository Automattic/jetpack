import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import Button from 'components/button';
import SimpleNotice from 'components/notice';
import analytics from 'lib/analytics';

/**
 * Invites an existing self-hosted install to switch to the new Jetpack SEO dashboard.
 * Renders only while the seo package reports `window.JetpackScriptData.seo.optin_available`.
 *
 * @return {import('react').ReactElement|null} The banner, or null when the opt-in isn't offered.
 */
export default function SeoOptInBanner() {
	const [ inProgress, setInProgress ] = useState( false );
	const [ hasError, setHasError ] = useState( false );

	// The opt-in route marks the surface visible, activates seo-tools, and returns the dashboard URL.
	const optIn = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_wpa_seo_optin_banner_click', {
			surface: 'traffic_settings',
		} );

		setInProgress( true );
		setHasError( false );

		apiFetch( {
			path: '/jetpack/v4/seo/opt-in',
			method: 'POST',
		} )
			.then( response => {
				if ( response?.redirect ) {
					window.location.href = response.redirect;
					return;
				}
				setInProgress( false );
				setHasError( true );
			} )
			.catch( () => {
				setInProgress( false );
				setHasError( true );
			} );
	}, [] );

	if ( ! getScriptData()?.seo?.optin_available ) {
		return null;
	}

	const ctaCaption = inProgress
		? _x( 'Switching…', 'Button caption', 'jetpack' )
		: _x(
				'Use the new experience',
				'Button caption',
				'jetpack',
				/* dummy arg to avoid bad minification */ 0
			);

	return (
		<SimpleNotice
			status="is-info"
			showDismiss={ false }
			className="jp-seo-optin-banner"
			title={ __( 'SEO has a new home', 'jetpack' ) }
		>
			<div className="jp-seo-optin-banner__content">
				<p>
					{ __(
						'Manage all of your search engine optimization from the redesigned Jetpack SEO dashboard. Switching also enables Jetpack SEO tools if they are off. Your existing settings are kept.',
						'jetpack'
					) }
				</p>
				{ hasError && (
					<p className="jp-seo-optin-banner__error">
						{ __(
							'Something went wrong while switching to the new experience. Please try again.',
							'jetpack'
						) }
					</p>
				) }
				<Button primary rna compact onClick={ optIn } disabled={ inProgress }>
					{ ctaCaption }
				</Button>
			</div>
		</SimpleNotice>
	);
}
