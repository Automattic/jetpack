import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import Module from '$features/module/module';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './critical-css-module.module.scss';

const CriticalCssModule = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const regenerateCssAction = useRegenerateCriticalCssAction();

	const handleCriticalCssLink = () => {
		recordBoostEvent( 'critical_css_link_clicked', {} );
	};

	return (
		<Module
			slug="critical_css"
			title={ __( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' ) }
			onEnable={ () => regenerateCssAction.mutate() }
			description={
				<>
					<p>
						{ createInterpolateElement(
							__(
								`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.`,
								'jetpack-boost'
							),
							{
								link: (
									<Link openInNewTab href={ criticalCssLink } onClick={ handleCriticalCssLink } />
								),
							}
						) }
					</p>
					<div className={ styles[ 'tooltip-wrapper' ] }>
						<p>
							{ createInterpolateElement(
								__(
									`<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
									'jetpack-boost'
								),
								{
									b: <b />,
								}
							) }
						</p>
						<PremiumTooltip />
					</div>
				</>
			}
		>
			<CriticalCssMeta />

			<InterstitialModalCTA
				identifier="critical-css"
				description={ __(
					'Save time by upgrading to Automatic Critical CSS generation.',
					'jetpack-boost'
				) }
			/>
		</Module>
	);
};

export default CriticalCssModule;
