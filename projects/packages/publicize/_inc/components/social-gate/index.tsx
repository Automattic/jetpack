import ConnectionGate from './connection-gate';
import PricingGate from './pricing-gate';
import type { SocialGateType } from './use-social-gate';
import type { ReactNode } from 'react';

/**
 * Presentational gate switch for the modernization chassis. The decision lives in
 * `useSocialGate()` (owned by `SocialPage`); this component just renders the matching
 * gate, or the children (the Overview/Settings tabs) on the happy path.
 *
 * @param props                  - Component props.
 * @param props.gate             - Which gate to show, or null for the tabs.
 * @param props.onDismissPricing - Dismiss handler passed to the pricing gate.
 * @param props.children         - The tab block rendered on the happy path.
 * @return The gate or the children.
 */
export default function SocialGate( {
	gate,
	onDismissPricing,
	children,
}: {
	gate: SocialGateType;
	onDismissPricing: () => void;
	children: ReactNode;
} ): JSX.Element {
	if ( gate === 'connection' ) {
		return <ConnectionGate />;
	}

	if ( gate === 'pricing' ) {
		return <PricingGate onDismiss={ onDismissPricing } />;
	}

	return <>{ children }</>;
}
