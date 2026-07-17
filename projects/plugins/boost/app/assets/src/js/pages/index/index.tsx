import CornerstonePages from '$features/cornerstone-pages/cornerstone-pages';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import { ImageCdnLiar, QualitySettings } from '$features/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import PageCacheModule from '$features/page-cache/page-cache';
import RenderBlockingJsMeta from '$features/render-blocking-js/render-blocking-js-meta';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import Upgraded from '$features/ui/upgraded/upgraded';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';
import { recordBoostEvent } from '$lib/utils/analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import styles from './index.module.scss';
import LcpModule from '$features/lcp/lcp';

const Index = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	const regenerateCssAction = useRegenerateCriticalCssAction();

	const requestRegenerateCriticalCss = () => {
		regenerateCssAction.mutate();
	};

	const [ imageCdnQualityState ] = useSingleModuleState( 'image_cdn_quality' );
	const [ imageCdnLiarState ] = useSingleModuleState( 'image_cdn_liar' );

	const hasPremiumCdnFeatures = imageCdnQualityState?.available && imageCdnLiarState?.available;

	const handleCriticalCssLink = () => {
		recordBoostEvent( 'critical_css_link_clicked', {} );
	};

	return (
		<div className="jb-container--narrow">
			<CornerstonePages />
			<Module
				slug="critical_css"
				title={ __( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' ) }
				onEnable={ requestRegenerateCriticalCss }
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
			<Module
				slug="cloud_css"
				title={
					<>
						{ __( 'Automatically Optimize CSS Loading', 'jetpack-boost' ) }
						<Upgraded />
					</>
				}
				worksOffline={ false }
				onEnable={ requestRegenerateCriticalCss }
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
						<p>
							{ createInterpolateElement(
								__(
									`<b>Boost will automatically generate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
									'jetpack-boost'
								),
								{
									b: <strong />,
								}
							) }
						</p>
					</>
				}
			>
				<CloudCssMeta />
			</Module>
			<LcpModule />
			<PageCacheModule />
			<Module
				slug="render_blocking_js"
				title={ __( 'Defer Non-Essential JavaScript', 'jetpack-boost' ) }
				description={
					<p>
						{ createInterpolateElement(
							__(
								`Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.`,
								'jetpack-boost'
							),
							{
								link: (
									<Link
										openInNewTab
										onClick={ () => recordBoostEvent( 'defer_js_link_clicked', {} ) }
										href={ deferJsLink }
									/>
								),
							}
						) }
					</p>
				}
			>
				<RenderBlockingJsMeta />
			</Module>
			<MinifyJs />
			<MinifyCss />
			<Module
				slug="image_cdn"
				title={
					<>
						{ __( 'Image CDN', 'jetpack-boost' ) }
						{ hasPremiumCdnFeatures && <Upgraded /> }
					</>
				}
				worksOffline={ false }
				description={
					<p>
						{ __(
							`Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.`,
							'jetpack-boost'
						) }
					</p>
				}
			>
				{ ! hasPremiumCdnFeatures && (
					<InterstitialModalCTA
						identifier="image-cdn"
						description={ __(
							'Auto-resize lazy images and adjust their quality.',
							'jetpack-boost'
						) }
					/>
				) }
				<ImageCdnLiar isPremium={ imageCdnLiarState?.available ?? false } />
				<QualitySettings isPremium={ imageCdnQualityState?.available ?? false } />
			</Module>
			<div className={ styles.settings }>
				<ImageGuide />
			</div>
		</div>
	);
};

export default Index;
