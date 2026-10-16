/* eslint-disable react/jsx-no-bind -- a component-scope handler recreated per render is fine for a single banner. */

import { UpsellBanner as BaseUpsellBanner } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getUpsellUrl } from '../data/is-gated';
import type { FC } from 'react';

// Set when the user clicks the upgrade CTA (which opens checkout in a new tab).
// Read when this tab regains focus, so we only reload after an actual upgrade
// attempt rather than on every incidental tab switch. Session-scoped so it
// doesn't survive the reload it triggers.
const UPGRADE_PENDING_KEY = 'jetpack-seo-upgrade-pending';

/**
 * Dotcom-style upsell banner shown at the top of the Overview and Settings tabs
 * when the SEO dashboard is plan-gated (a below-Premium WordPress.com site).
 *
 * Copy mirrors the legacy Calypso SEO UpsellNudge. The Premium checkout URL is
 * bootstrapped server-side (see `getUpsellUrl`).
 *
 * Checkout opens in a new tab, so when the user returns to this one after
 * upgrading, the bootstrapped gating state is stale and the reduced view +
 * banner would otherwise linger until a manual reload. To avoid that friction we
 * flag the upgrade attempt on click and reload once on the next focus, letting
 * the server re-evaluate the gate — a successful upgrade then drops straight into
 * the full dashboard with no banner, and a cancelled one is harmless.
 *
 * @return The upsell banner.
 */
const UpsellBanner: FC = () => {
	useEffect( () => {
		const onFocus = () => {
			if ( window.sessionStorage.getItem( UPGRADE_PENDING_KEY ) ) {
				window.sessionStorage.removeItem( UPGRADE_PENDING_KEY );
				window.location.reload();
			}
		};

		window.addEventListener( 'focus', onFocus );
		return () => window.removeEventListener( 'focus', onFocus );
	}, [] );

	const onUpgradeClick = () => {
		window.sessionStorage.setItem( UPGRADE_PENDING_KEY, '1' );
	};

	return (
		<BaseUpsellBanner
			title={ __( 'Boost your search engine ranking', 'jetpack-seo' ) }
			description={ __(
				'Get tools to optimize your site for improved search engine results.',
				'jetpack-seo'
			) }
			primaryCtaLabel={ __( 'Upgrade', 'jetpack-seo' ) }
			primaryCtaURL={ getUpsellUrl() }
			primaryCtaOnClick={ onUpgradeClick }
			primaryCtaIsExternalLink
		/>
	);
};

export default UpsellBanner;
