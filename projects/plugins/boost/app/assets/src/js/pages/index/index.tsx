import CornerstonePages from '$features/cornerstone-pages/cornerstone-pages';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import { ImageCdnLiar, QualitySettings } from '$features/image-cdn';
import { RecommendationsMeta } from '$features/image-size-analysis';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import PageCacheModule from '$features/page-cache/page-cache';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import Pill from '$features/ui/pill/pill';
import Upgraded from '$features/ui/upgraded/upgraded';
import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import styles from './index.module.scss';

const Index = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );
	const [ imageCdn ] = useSingleModuleState( 'image_cdn' );
	const regenerateCssAction = useRegenerateCriticalCssAction();

	const requestRegenerateCriticalCss = () => {
		regenerateCssAction.mutate();
	};
	const { canResizeImages } = Jetpack_Boost;

	const premiumFeatures = usePremiumFeatures();
	const hasPremiumCdnFeatures =
		premiumFeatures.includes( 'image-cdn-liar' ) && premiumFeatures.includes( 'image-cdn-quality' );

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
										// eslint-disable-next-line jsx-a11y/anchor-has-content
										<a
											href={ criticalCssLink }
											target="_blank"
											onClick={ handleCriticalCssLink }
											style={ { cursor: 'pointer' } }
											rel="noopener noreferrer"
										/>
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

				<UpgradeCTA
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
										// eslint-disable-next-line jsx-a11y/anchor-has-content
										<a
											href={ criticalCssLink }
											target="_blank"
											onClick={ handleCriticalCssLink }
											style={ { cursor: 'pointer' } }
											rel="noopener noreferrer"
										/>
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
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									<a
										onClick={ () => recordBoostEvent( 'defer_js_link_clicked', {} ) }
										href={ deferJsLink }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							}
						) }
					</p>
				}
			></Module>
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
					<UpgradeCTA
						identifier="image-cdn"
						description={ __(
							'Auto-resize lazy images and adjust their quality.',
							'jetpack-boost'
						) }
					/>
				) }
				<ImageCdnLiar isPremium={ premiumFeatures.includes( 'image-cdn-liar' ) } />
				<QualitySettings isPremium={ premiumFeatures.includes( 'image-cdn-quality' ) } />
			</Module>

			<div className={ styles.settings }>
				<Module
					slug="image_guide"
					title={ __( 'Image Guide', 'jetpack-boost' ) }
					description={
						<>
							<p>
								{ __(
									`This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.`,
									'jetpack-boost'
								) }
							</p>
							{ ! isaState?.available && (
								<UpgradeCTA
									identifier="image-guide"
									description={ __(
										'Upgrade to scan your site for issues - automatically!',
										'jetpack-boost'
									) }
								/>
							) }
						</>
					}
				>
					{ false === canResizeImages && (
						<Notice
							level="warning"
							title={ __( 'Image resizing is unavailable', 'jetpack-boost' ) }
							hideCloseButton={ true }
						>
							<p>
								{ __(
									"It looks like your server doesn't have Imagick or GD extensions installed.",
									'jetpack-boost'
								) }
							</p>
							<p>
								{ __(
									"Jetpack Boost is able to work without these extensions, but it's likely that it's going to be difficult for you to optimize the images that the Image Guide will identify without one of these extensions.",
									'jetpack-boost'
								) }
							</p>
							<p>
								{ __(
									'Please contact your hosting provider or system administrator and ask them to install or activate one of these extensions.',
									'jetpack-boost'
								) }
							</p>
						</Notice>
					) }
				</Module>

				<Module
					slug="image_size_analysis"
					toggle={ false }
					title={
						<>
							{ __( 'Image Size Analysis', 'jetpack-boost' ) }
							<Pill text={ __( 'Beta', 'jetpack-boost' ) } />
						</>
					}
					description={
						<p>
							{ __(
								`This tool will search your site for images that are too large and have an impact on your visitors' experience, page loading times, and search rankings. Once finished, it will give you a report of all improperly sized images with suggestions on how to fix them.`,
								'jetpack-boost'
							) }
						</p>
					}
				>
					{ isaState?.active && <RecommendationsMeta isCdnActive={ !! imageCdn?.active } /> }
				</Module>
			</div>
		</div>
	);
};

export default Index;
