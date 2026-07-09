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
	const { isRegistered, isUserConnected } = useConnection();

	const showPricingPage = useSelect(
		select => select( socialStore ).getSocialSettings().showPricingPage,
		[]
	);

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
	}

	return { gate, dismissPricing };
}
