/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';

const EnableJetpackSearchPrompt = () => {
	let wpAdminUrl = window?.Jetpack_Editor_Initial_State?.adminUrl || '';
	// We have to remove frame-nonce in case we are doing calypsoify.
	wpAdminUrl = wpAdminUrl.replace( /wp-admin\/\?frame-nonce=[a-z0-9]+/, 'wp-admin/' );
	const checkoutUrl = `${ wpAdminUrl }admin.php?page=jetpack-search`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	if ( window?.Jetpack_AIChatBlock?.jetpackSettings?.instant_search_enabled ) {
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
