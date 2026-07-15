import { UpsellBanner as BaseUpsellBanner } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { getUpsellUrl } from '../data/is-gated';
import type { FC } from 'react';

/**
 * Dotcom-style upsell banner shown at the top of the Overview and Settings tabs
 * when the SEO dashboard is plan-gated (a below-Premium WordPress.com site).
 *
 * Copy mirrors the legacy Calypso SEO UpsellNudge. The Premium checkout URL is
 * bootstrapped server-side (see `getUpsellUrl`).
 *
 * @return The upsell banner.
 */
const UpsellBanner: FC = () => (
	<BaseUpsellBanner
		title={ __( 'Boost your search engine ranking', 'jetpack-seo' ) }
		description={ __(
			'Get tools to optimize your site for improved search engine results.',
			'jetpack-seo'
		) }
		primaryCtaLabel={ __( 'Upgrade', 'jetpack-seo' ) }
		primaryCtaURL={ getUpsellUrl() }
		primaryCtaIsExternalLink
	/>
);

export default UpsellBanner;
