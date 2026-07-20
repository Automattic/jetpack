import OfflineModeScreen from '@automattic/jetpack-connection/offline-mode-screen';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
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
		offlineMode,
	} = useConnection( {
		from: 'jetpack-videopress',
		redirectUri: VIDEOPRESS_ADMIN_PAGE,
	} );

	// WordPress.com Simple sites are inherently wpcom-connected: uploads and the
	// management REST go through wpcom natively, with no separate Jetpack
	// site/user connection, so the connection gate doesn't apply. Access is
	// already gated by the VideoPress site feature that surfaces the dashboard.
	// (useConnection still runs above so hook order stays stable.)
	if ( isSimpleSite() ) {
		return <>{ children }</>;
	}

	const canPerformAction = isRegistered && hasConnectedOwner && isUserConnected;

	if ( canPerformAction ) {
		return <>{ children }</>;
	}

	const hasPricing =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' &&
		Boolean( JPVIDEOPRESS_INITIAL_STATE?.pricing );

	// Unregistered sites get the full pricing upsell -- including in local
	// development mode: the price/product payload is a public, unauthenticated
	// WPCOM catalog lookup (see class-initial-state.php's get_pricing_data()),
	// so it's real data regardless of whether this site itself is reachable.
	// "Get VideoPress" is a real external checkout redirect that works the same
	// way either way; "Start for free" attempts a real site connection, which
	// (like on any disconnected site) can fail -- local development mode isn't
	// special-cased there, since the actual point of failure varies by cause.
	if ( ! isRegistered && hasPricing ) {
		return <PricingUpsell />;
	}

	if ( offlineMode?.isActive ) {
		return (
			<OfflineModeScreen
				productName="VideoPress"
				subTitle={ __( 'Professional quality, ad-free video hosting.', 'jetpack-videopress-pkg' ) }
			/>
		);
	}

	return (
		<ConnectScreen
			onConnect={ () => handleRegisterSite() }
			isConnecting={ siteIsRegistering || userIsConnecting }
		/>
	);
}
