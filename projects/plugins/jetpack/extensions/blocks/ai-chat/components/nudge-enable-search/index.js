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

const UpgradePrompt = () => {
	const calypsoSlug = window?.Jetpack_AIChatBlock?.jetpackSettings?.calypsoSlug;
	const redirectUrl = window.location;
	const upgradeUrl = getProductCheckoutUrl( 'jetpack_search', calypsoSlug, redirectUrl, true );
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( upgradeUrl );
	const goToCheckoutPage = event => {
		autosaveAndRedirect( event );
	};
	return (
		<Nudge
			buttonText={ __( 'Upgrade', 'jetpack' ) }
			checkoutUrl={ upgradeUrl }
			className={ 'jetpack-ai-connect-banner' }
			description={ __( 'Upgrade to enable Jetpack Search', 'jetpack' ) }
			goToCheckoutPage={ goToCheckoutPage }
			isRedirecting={ isRedirecting }
			visible={ true }
		/>
	);
};

const ActivatePrompt = () => {
	let wpAdminUrl = window?.Jetpack_Editor_Initial_State?.adminUrl || '';
	// Remove frame-nonce in case we are doing calypsoify
	wpAdminUrl = wpAdminUrl.replace( /wp-admin\/\?frame-nonce=[a-z0-9]+/, 'wp-admin/' );
	const activateUrl = `${ wpAdminUrl }admin.php?page=jetpack-search`;
	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( activateUrl );
	const goToActivatePage = event => {
		autosaveAndRedirect( event );
	};
	return (
		<Nudge
			buttonText={ __( 'Enable', 'jetpack' ) }
			checkoutUrl={ activateUrl }
			className={ 'jetpack-ai-connect-banner' }
			description={ __(
				'Turn on the Instant Search feature so Jetpack AI can index your site.',
				'jetpack'
			) }
			goToCheckoutPage={ goToActivatePage }
			isRedirecting={ isRedirecting }
			visible={ true }
		/>
	);
};

const EnableJetpackSearchPrompt = () => {
	const instantSearchEnabled = window?.Jetpack_AIChatBlock?.jetpackSettings?.instant_search_enabled;
	const isFreePlan = window?.Jetpack_AIChatBlock?.jetpackSettings?.is_free_plan;
	const planSupportsSearch = window?.Jetpack_AIChatBlock?.jetpackSettings?.plan_supports_search;
	const requiresUpgrade = isFreePlan || ! planSupportsSearch;

	if ( instantSearchEnabled && ! requiresUpgrade ) {
		return null;
	}

	return requiresUpgrade ? <UpgradePrompt /> : <ActivatePrompt />;
};

export default EnableJetpackSearchPrompt;
