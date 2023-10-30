/*
 * External dependencies
 */
import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';

const EnableJetpackSearchPrompt = () => {
	const instantSearchEnabled = window?.Jetpack_AIChatBlock?.jetpackSettings?.instant_search_enabled;
	const isFreePlan = window?.Jetpack_AIChatBlock?.jetpackSettings?.is_free_plan;
	const planSupportsSearch = window?.Jetpack_AIChatBlock?.jetpackSettings?.plan_supports_search;
	const requiresUpgrade = isFreePlan || ! planSupportsSearch;

	// Build the upgrade or activate URLs and flows.
	const calypsoSlug = window?.Jetpack_AIChatBlock?.jetpackSettings?.calypsoSlug;
	const redirectUrl = window.location;
	const upgradeUrl = getProductCheckoutUrl( 'jetpack_search', calypsoSlug, redirectUrl, true );

	let wpAdminUrl = window?.Jetpack_Editor_Initial_State?.adminUrl || '';
	// We have to remove frame-nonce in case we are doing calypsoify.
	wpAdminUrl = wpAdminUrl.replace( /wp-admin\/\?frame-nonce=[a-z0-9]+/, 'wp-admin/' );
	const activateUrl = `${ wpAdminUrl }admin.php?page=jetpack-search`;
	const checkoutUrl = requiresUpgrade ? upgradeUrl : activateUrl;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	const goToCheckoutPage = event => {
		autosaveAndRedirect( event );
	};

	if ( instantSearchEnabled && ! requiresUpgrade ) {
		return null;
	}

	return (
		<Nudge
			buttonText={
				requiresUpgrade ? __( 'Upgrade', 'jetpack' ) : __( 'Enable Instant Search', 'jetpack' )
			}
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-connect-banner' }
			description={
				requiresUpgrade
					? __( 'Upgrade to enable Jetpack Search', 'jetpack' )
					: __(
							'You need to enable the Instant Search feature so that Jetpack AI can index your site.',
							'jetpack'
					  )
			}
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
