import useConnection from '@automattic/jetpack-connection/use-connection';
import { isJetpackSelfHostedSite, isSimpleSite } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';
import { canToggleSocialModule } from '../../utils/misc';

export type SocialGateType = 'connection' | 'pricing' | 'inactive' | null;

/**
 * Decides which gate (if any) the modernized Social dashboard should show.
 * Owned by `SocialPage` so the gate decision is shared between the page-header
 * actions (suppressed while gated) and the gate body. Returns `null` for the
 * happy path (render the tabs).
 *
 * @return The current gate type and a callback to dismiss the pricing gate.
 */
export default function useSocialGate(): {
	gate: SocialGateType;
	dismissPricing: () => void;
} {
	const { isRegistered, isUserConnected } = useConnection();

	const { showPricingPage, isPublicizeActive } = useSelect( select => {
		const store = select( socialStore );
		return {
			showPricingPage: store.getSocialSettings().showPricingPage,
			isPublicizeActive: store.getSocialModuleSettings().publicize,
		};
	}, [] );

	const [ pricingDismissed, setPricingDismissed ] = useState( false );
	const dismissPricing = useCallback( () => setPricingDismissed( true ), [] );

	let gate: SocialGateType = null;

	// WPCOM Simple sites have no Jetpack connection to establish, so the connection
	// gate never applies there (mirrors the legacy admin page's `! isSimple` guard).
	if ( ! isSimpleSite() && ( ! isRegistered || ! isUserConnected ) ) {
		gate = 'connection';
	} else if (
		isJetpackSelfHostedSite() &&
		! hasSocialPaidFeatures() &&
		showPricingPage &&
		! pricingDismissed
	) {
		gate = 'pricing';
	} else if ( ! isPublicizeActive && canToggleSocialModule() ) {
		// Publicize is off and this user can switch it on — show the activation
		// gate (educational onboarding + the master toggle) in place of the tabs.
		// `canToggleSocialModule()` is false on WPCOM (always-on) and for users
		// without `manage_modules`, so those fall straight through to the tabs.
		gate = 'inactive';
	}

	return { gate, dismissPricing };
}
