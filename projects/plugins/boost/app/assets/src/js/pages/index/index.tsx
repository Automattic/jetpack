import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';
import { Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import MinifyMeta from '$features/minify-meta/minify-meta';
import { QualitySettings } from '$features/image-cdn';
import styles from './index.module.scss';
import { RecommendationsMeta } from '$features/image-size-analysis';
import SuperCacheInfo from '$features/super-cache-info/super-cache-info';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import Upgraded from '$features/ui/upgraded/upgraded';
import PageCache from '$features/page-cache/page-cache';
import { usePageCacheError, usePageCacheSetup } from '$lib/stores/page-cache';
import Health from '$features/page-cache/health/health';
import { useMutationNotice } from '$features/ui';
import { useShowCacheEngineErrorNotice } from '$features/page-cache/lib/stores';

const Index = () => {
	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );

	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );
	const [ imageCdn ] = useSingleModuleState( 'image_cdn' );
	const [ pageCache ] = useSingleModuleState( 'page_cache' );

	const regenerateCssAction = useRegenerateCriticalCssAction();
	const requestRegenerateCriticalCss = () => {
		regenerateCssAction.mutate();
	};
	const { canResizeImages, site } = Jetpack_Boost;

	const premiumFeatures = usePremiumFeatures();

	const pageCacheSetup = usePageCacheSetup();
	const [ pageCacheError, pageCacheErrorMutation ] = usePageCacheError();
	const [ isPageCacheSettingUp, setIsPageCacheSettingUp ] = useState( false );
	const [ runningFreshSetup, setRunningFreshSetup ] = useState( false );
	const showCacheEngineErrorNotice = useShowCacheEngineErrorNotice(
		pageCacheSetup.isSuccess && !! pageCache?.active
	);

	const [ removePageCacheNotice ] = useMutationNotice(
		'page-cache-setup',
		{
			...pageCacheSetup,

			/*
			 * We run page cache setup on both onMountEnabled and onEnable.
			 * However, the mutation notice should only show when the user is responsible for the action.
			 * So, we only show the notice if `runningFreshSetup`, unless it's an error.
			 */
			isSuccess: runningFreshSetup && pageCacheSetup.isSuccess,
			isPending: runningFreshSetup && ( isPageCacheSettingUp || pageCacheSetup.isPending ),
			isIdle: runningFreshSetup && pageCacheSetup.isIdle,
		},
		{
			savingMessage: __( 'Setting up cache…', 'jetpack-boost' ),
			errorMessage: __( 'An error occurred while setting up cache.', 'jetpack-boost' ),
			successMessage: __( 'Cache setup complete.', 'jetpack-boost' ),
		}
	);

	useEffect( () => {
		if ( pageCacheSetup.isPending ) {
			setIsPageCacheSettingUp( false );
		}
	}, [ pageCacheSetup.isPending ] );

	return (
		<div className="jb-container--narrow">
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
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									link: <a href={ criticalCssLink } target="_blank" rel="noopener noreferrer" />,
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
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									link: <a href={ criticalCssLink } target="_blank" rel="noopener noreferrer" />,
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
			<Module
				slug="page_cache"
				title={
					<>
						{ __( 'Cache Site Pages', 'jetpack-boost' ) }
						<span className={ styles.beta }>Beta</span>
					</>
				}
				onBeforeToggle={ status => {
					setIsPageCacheSettingUp( status );
					if ( status === false ) {
						removePageCacheNotice();
						pageCacheSetup.reset();
					}
					if ( pageCacheError.data && pageCacheError.data.dismissed !== true ) {
						pageCacheErrorMutation.mutate( {
							...pageCacheError.data,
							dismissed: true,
						} );
					}
				} }
				onMountEnable={ () => {
					pageCacheSetup.mutate();
				} }
				onEnable={ () => {
					setRunningFreshSetup( true );
					pageCacheSetup.mutate();
				} }
				description={
					<>
						<p>
							{ __(
								'Store and serve preloaded content to reduce load times and enhance your site performance and user experience.',
								'jetpack-boost'
							) }
						</p>
						{ site.isAtomic && (
							<Notice
								level="warning"
								title={ __( 'Page Cache is unavailable', 'jetpack-boost' ) }
								hideCloseButton={ true }
							>
								<p>
									{ __(
										'Your website already has a page cache running on it powered by WordPress.com.',
										'jetpack-boost'
									) }
								</p>
							</Notice>
						) }
						<Health
							error={ pageCacheError.data }
							setError={ pageCacheErrorMutation.mutate }
							setup={ pageCacheSetup }
						/>
					</>
				}
			>
				{ showCacheEngineErrorNotice && (
					<Notice
						level="warning"
						title={ __( 'Page Cache is not working', 'jetpack-boost' ) }
						hideCloseButton={ true }
					>
						<p>
							{ __(
								'It appears that the cache engine is not loading. Please try re-installing Jetpack Boost. If the issue persists, please contact support.',
								'jetpack-boost'
							) }
						</p>
					</Notice>
				) }
				{ ! showCacheEngineErrorNotice && ! pageCacheError.data && ! pageCacheSetup.isError && (
					<PageCache />
				) }
			</Module>
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
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								link: <a href={ deferJsLink } target="_blank" rel="noopener noreferrer" />,
							}
						) }
					</p>
				}
			></Module>
			<Module
				slug="minify_js"
				title={ __( 'Concatenate JS', 'jetpack-boost' ) }
				description={
					<p>
						{ __(
							'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
							'jetpack-boost'
						) }
					</p>
				}
			>
				<MinifyMeta
					datasyncKey="minify_js_excludes"
					inputLabel={ __( 'Exclude JS Strings:', 'jetpack-boost' ) }
					buttonText={ __( 'Exclude JS Strings', 'jetpack-boost' ) }
					placeholder={ __( 'Comma separated list of JS scripts to exclude', 'jetpack-boost' ) }
				/>
			</Module>
			<Module
				slug="minify_css"
				title={ __( 'Concatenate CSS', 'jetpack-boost' ) }
				description={
					<p>
						{ __(
							'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
							'jetpack-boost'
						) }
					</p>
				}
			>
				<MinifyMeta
					datasyncKey="minify_css_excludes"
					inputLabel={ __( 'Exclude CSS Strings:', 'jetpack-boost' ) }
					buttonText={ __( 'Exclude CSS Strings', 'jetpack-boost' ) }
					placeholder={ __(
						'Comma separated list of CSS stylesheets to exclude',
						'jetpack-boost'
					) }
				/>
			</Module>
			<Module
				slug="image_cdn"
				title={ __( 'Image CDN', 'jetpack-boost' ) }
				description={
					<p>
						{ __(
							`Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.`,
							'jetpack-boost'
						) }
					</p>
				}
			>
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
							<span className={ styles.beta }>Beta</span>
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

			{ ! pageCache?.active && <SuperCacheInfo /> }
		</div>
	);
};

export default Index;
