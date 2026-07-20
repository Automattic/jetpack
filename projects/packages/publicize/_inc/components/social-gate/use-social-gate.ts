import useConnection from '@automattic/jetpack-connection/use-connection';
import { isJetpackSelfHostedSite, isSimpleSite } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';

export type SocialGateType = 'connection' | 'pricing' | null;

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
	const { isRegistered, isUserConnected, offlineMode } = useConnection();
	const isOfflineMode = Boolean( offlineMode?.isActive );

	const showPricingPage = useSelect(
		select => select( socialStore ).getSocialSettings().showPricingPage,
		[]
	);

	const [ pricingDismissed, setPricingDismissed ] = useState( false );
	const dismissPricing = useCallback( () => setPricingDismissed( true ), [] );

	let gate: SocialGateType = null;

	// WPCOM Simple sites have no Jetpack connection to establish, so the connection
	// gate never applies there (mirrors the legacy admin page's `! isSimple` guard).
	// Offline mode sites can never complete a connection either, but rather than a
	// "Get Started" wall that's a dead end, they fall through to the real tabs --
	// the traffic chart and connections list render their own offline-aware demo
	// content instead.
	if ( ! isSimpleSite() && ! isOfflineMode && ( ! isRegistered || ! isUserConnected ) ) {
		gate = 'connection';
	} else if (
		// The pricing nudge exists to sell an upgrade -- pointless (and, since the
		// underlying module toggle needs a live connection to save, currently a
		// dead end) for a site that can't complete a purchase or connection at
		// all right now. Offline sites skip straight to the real tabs.
		! isOfflineMode &&
		isJetpackSelfHostedSite() &&
		! hasSocialPaidFeatures() &&
		showPricingPage &&
		! pricingDismissed
	) {
		gate = 'pricing';
	}

	return { gate, dismissPricing };
}
