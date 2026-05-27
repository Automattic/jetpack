import useConnection from '@automattic/jetpack-connection/use-connection';
import { VIDEOPRESS_ADMIN_PAGE } from '../../utils/constants';
import ConnectScreen from './connect-screen';
import PricingUpsell from './pricing-upsell';
import type { ReactNode } from 'react';

/**
 * Gates the whole dashboard behind a WordPress.com connection. VideoPress
 * uploads and the management REST endpoints require a connected site *and* a
 * connected user, so when either is missing we render a connection screen
 * instead of the dashboard — otherwise the uploader is exposed and every upload
 * fails. Mirrors the legacy dashboard's `usePermission` gate
 * (`isRegistered && hasConnectedOwner && isUserConnected`).
 *
 * When the site isn't registered we show the pricing upsell (ported from the
 * legacy dashboard); once registered but missing a connected owner/user we show
 * the lighter connect screen — the same split the legacy dashboard made between
 * its `PricingSection` and `NeedUserConnectionGlobalNotice`.
 *
 * Rendered inside `QueryClientWrapper` — the single wrapper every route stage
 * shares — so all four routes (overview, library, settings, video) are gated
 * from one mount point.
 *
 * @param props          - Component props.
 * @param props.children - The dashboard content to render once connected.
 * @return The dashboard children when connected, otherwise a connection screen.
 */
export default function ConnectionGate( { children }: { children: ReactNode } ) {
	const {
		isRegistered,
		hasConnectedOwner,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		handleRegisterSite,
	} = useConnection( {
		from: 'jetpack-videopress',
		redirectUri: VIDEOPRESS_ADMIN_PAGE,
	} );

	const canPerformAction = isRegistered && hasConnectedOwner && isUserConnected;

	if ( canPerformAction ) {
		return <>{ children }</>;
	}

	const hasPricing =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' &&
		Boolean( JPVIDEOPRESS_INITIAL_STATE?.pricing );

	// Unregistered sites get the full pricing upsell; everything else (registered
	// but no connected owner/user, or missing pricing data) gets the lighter
	// connect screen, whose CTA registers the site and/or connects the user.
	if ( ! isRegistered && hasPricing ) {
		return <PricingUpsell />;
	}

	return (
		<ConnectScreen
			onConnect={ () => handleRegisterSite() }
			isConnecting={ siteIsRegistering || userIsConnecting }
		/>
	);
}
