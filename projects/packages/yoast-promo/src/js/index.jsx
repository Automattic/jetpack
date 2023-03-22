import { PanelRow, ExternalLink, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import Gridicon from 'gridicons';
import { useState } from 'react';
import { JetpackYoastLogos } from './JetpackYoastLogos';

const PLUGIN_SLUG_YOAST_FREE = 'wordpress-seo/wp-seo';
const PLUGIN_SLUG_YOAST_PREMIUM = 'wordpress-seo-premium/wp-seo-premium';

export const YoastPromo = () => {
	const [ isDismissed, setIsDismissed ] = useState( false );
	const { isYoastFreeActive, isYoastPremiumActive } = useSelect( select => {
		const { getPlugin } = select( 'core' );

		const isPluginActive = slug => {
			const plugin = getPlugin( slug );
			return plugin && 'active' === plugin.status;
		};

		return {
			isYoastFreeActive: isPluginActive( PLUGIN_SLUG_YOAST_FREE ),
			isYoastPremiumActive: isPluginActive( PLUGIN_SLUG_YOAST_PREMIUM ),
		};
	} );

	const handleDismiss = () => setIsDismissed( true );

	const getContent = () => {
		if ( ! isYoastFreeActive && ! isYoastPremiumActive ) {
			return YoastPromoContentFree;
		} else if ( isYoastFreeActive && ! isYoastPremiumActive ) {
			return YoastPromoContentPremium;
		}

		return null;
	};

	const Content = getContent();

	if ( isDismissed || ! Content ) {
		return null;
	}

	return (
		<PluginPrePublishPanel className="container">
			<PanelRow className="header">
				<JetpackYoastLogos />
				<Button className="button-close" onClick={ handleDismiss }>
					<Gridicon icon="cross" />
				</Button>
			</PanelRow>
			<Content />
		</PluginPrePublishPanel>
	);
};
export const YoastPromoContentFree = () => (
	<>
		<PanelRow className="is-bold">
			{ __( 'Boost your organic traffic with Jetpack and Yoast SEO', 'jetpack-yoast-promo' ) }
		</PanelRow>
		<PanelRow>
			{ __(
				'Jetpack recommends using Yoast SEO to improve your SEO. Find out how your content scores in Yoast’s SEO and readability analyses. Install Yoast SEO, optimize your content, and boost your organic traffic!',
				'jetpack-yoast-promo'
			) }
		</PanelRow>
		<PanelRow>
			<ExternalLink className="is-bold">
				{ __( 'Get Yoast SEO', 'jetpack-yoast-promo' ) }&nbsp;
			</ExternalLink>
		</PanelRow>
	</>
);

const YoastPromoContentPremium = () => (
	<>
		<PanelRow className="is-bold">
			{ __(
				'Boost your organic traffic with Jetpack and Yoast SEO Premium',
				'jetpack-yoast-promo'
			) }
		</PanelRow>
		<PanelRow>
			{ __(
				'Jetpack recommends using Yoast SEO Premium to further improve your SEO. Its enhanced analyses, social previews, and easy redirects help improve your site and boost your organic traffic!',
				'jetpack-yoast-promo'
			) }
		</PanelRow>
		<PanelRow>
			<ExternalLink className="is-bold">
				{ __( 'Get Yoast SEO Premium', 'jetpack-yoast-promo' ) }&nbsp;
			</ExternalLink>
		</PanelRow>
	</>
);
