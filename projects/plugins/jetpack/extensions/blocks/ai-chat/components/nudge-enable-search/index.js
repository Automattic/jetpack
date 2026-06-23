/*
 * External dependencies
 */
import { useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
import { Nudge } from '@automattic/jetpack-shared-extension-utils/components';
import { __ } from '@wordpress/i18n';

const EnableJetpackSearchPrompt = () => {
	let wpAdminUrl = window?.Jetpack_Editor_Initial_State?.adminUrl || '';
	// We have to remove frame-nonce in case we are doing calypsoify.
	wpAdminUrl = wpAdminUrl.replace( /wp-admin\/\?frame-nonce=[a-z0-9]+/, 'wp-admin/' );
	const checkoutUrl = `${ wpAdminUrl }admin.php?page=jetpack-search`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	// Jetpack AI only needs the Search module to be active so the site is indexed —
	// any front-end experience (Overlay / Theme / Inline / Embedded) works. Older
	// PHP versions of this block only exposed `instant_search_enabled`, so we fall
	// back to it to stay correct against an unbuilt/cached editor bundle.
	const jetpackSettings = window?.Jetpack_AIChatBlock?.jetpackSettings;
	const searchEnabled = jetpackSettings?.module_active ?? jetpackSettings?.instant_search_enabled;
	if ( searchEnabled ) {
		return null;
	}

	const goToCheckoutPage = event => {
		autosaveAndRedirect( event );
	};

	return (
		<Nudge
			buttonText={ __( 'Enable Jetpack Search', 'jetpack' ) }
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-connect-banner' }
			description={ __(
				'You need to enable Jetpack Search so that Jetpack AI can index your site.',
				'jetpack'
			) }
			goToCheckoutPage={ goToCheckoutPage }
			isRedirecting={ isRedirecting }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

export default EnableJetpackSearchPrompt;
