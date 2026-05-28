import useConnection from '@automattic/jetpack-connection/use-connection';
import { isJetpackSelfHostedSite } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';
import ConnectionGate from './connection-gate';
import PricingGate from './pricing-gate';
import type { ReactNode } from 'react';

/**
 * Client-side gate for the modernization chassis. Renders the connection gate
 * (disconnected) or the pricing gate (free Jetpack, nudge not dismissed) in place of
 * the Overview/Settings tabs; otherwise renders the tabs unchanged. Replaces the former
 * PHP `should_preempt_to_legacy()` fallback so the flag never loads legacy code.
 *
 * @param props          - Component props.
 * @param props.children - The tab block to render on the happy path.
 * @return The gate or the children.
 */
export default function SocialGate( { children }: { children: ReactNode } ): JSX.Element {
	const { isRegistered, isUserConnected } = useConnection();

	const showPricingPage = useSelect(
		select => select( socialStore ).getSocialSettings().showPricingPage,
		[]
	);

	const [ pricingDismissed, setPricingDismissed ] = useState( false );

	const dismissPricing = useCallback( () => setPricingDismissed( true ), [] );

	if ( ! isRegistered || ! isUserConnected ) {
		return <ConnectionGate />;
	}

	if (
		isJetpackSelfHostedSite() &&
		! hasSocialPaidFeatures() &&
		showPricingPage &&
		! pricingDismissed
	) {
		return <PricingGate onDismiss={ dismissPricing } />;
	}

	return <>{ children }</>;
}
