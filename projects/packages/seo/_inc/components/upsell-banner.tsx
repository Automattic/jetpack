/* eslint-disable react/jsx-no-bind -- a component-scope handler recreated per render is fine for a single banner. */

import { UpsellBanner as BaseUpsellBanner } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getUpsellUrl } from '../data/is-gated';
import type { FC } from 'react';

// Refresh eligibility if the user opens checkout in another tab and returns.
const UPGRADE_PENDING_KEY = 'jetpack-seo-upgrade-pending';

/**
 * Show an upgrade offer when the SEO dashboard is plan-gated.
 *
 * @return The upsell banner.
 */
const UpsellBanner: FC = () => {
	const upsellUrl = getUpsellUrl();

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

	if ( ! upsellUrl ) {
		return null;
	}

	return (
		<BaseUpsellBanner
			title={ __( 'Boost your search engine ranking', 'jetpack-seo' ) }
			description={ __(
				'Get tools to optimize your site for improved search engine results.',
				'jetpack-seo'
			) }
			primaryCtaLabel={ __( 'Upgrade', 'jetpack-seo' ) }
			primaryCtaURL={ upsellUrl }
			primaryCtaOnClick={ onUpgradeClick }
			primaryCtaIsExternalLink={ false }
		/>
	);
};

export default UpsellBanner;
