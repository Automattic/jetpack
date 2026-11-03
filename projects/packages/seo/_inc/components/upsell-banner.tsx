import { UpsellBanner as BaseUpsellBanner } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getUpsellUrl } from '../data/is-gated';
import { consumePendingUpgrade, markUpgradePending } from '../data/upgrade';
import type { FC } from 'react';

interface Props {
	title?: string;
	description?: string;
}

/**
 * Upgrade banner shared by the Overview and Settings screens.
 *
 * @param props             - Optional title and description for the current screen.
 * @param props.title       - Screen-specific banner title.
 * @param props.description - Explanation for the current screen.
 * @return The upsell banner.
 */
const UpsellBanner: FC< Props > = ( { title, description } ) => {
	useEffect( () => {
		const onFocus = () => {
			if ( consumePendingUpgrade() ) {
				window.location.reload();
			}
		};

		window.addEventListener( 'focus', onFocus );
		return () => window.removeEventListener( 'focus', onFocus );
	}, [] );

	return (
		<BaseUpsellBanner
			title={ title ?? __( 'Boost your search engine ranking', 'jetpack-seo' ) }
			description={
				description ??
				__( 'Get tools to optimize your site for improved search engine results.', 'jetpack-seo' )
			}
			primaryCtaLabel={ __( 'Upgrade', 'jetpack-seo' ) }
			primaryCtaURL={ getUpsellUrl() }
			primaryCtaOnClick={ markUpgradePending }
			primaryCtaIsExternalLink
		/>
	);
};

export default UpsellBanner;
