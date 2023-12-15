import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
import { CriticalCssState } from '$features/critical-css/lib/stores/critical-css-state-types';
import { useModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import UpgradeCTA from '$features/upgrade-cta/upgrade-cta';
import { Button, Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSuggestRegenerate } from './lib/hooks';
import {
	RegenerateCriticalCssSuggestion,
	continueGeneratingLocalCriticalCss,
	regenerateCriticalCss,
} from '$features/critical-css';
import { useCallback, useState } from 'react';
import {
	startPollingCloudStatus,
	stopPollingCloudCssStatus,
} from '$features/critical-css/lib/cloud-css';
import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
import MinifyMeta from '$features/minify-meta/minify-meta';
import { QualitySettings } from '$features/image-cdn';
import { z } from 'zod';
import styles from './index.module.scss';

type IndexProps = {
	/*
	 * TODO: Move these to react DS and get them directly from DS instead of as props.
	 * This should be done when moving the Main.svelte component to React.
	 */
	criticalCss: {
		criticalCssState: CriticalCssState;
		continueGeneratingLocalCriticalCss: unknown;
		regenerateCriticalCss: unknown;
		criticalCssProgress: number;
		isFatalError: boolean;
		criticalCssIssues: CriticalCssState[ 'providers' ];
		primaryErrorSet: unknown;
	};
};

const Index = ( { criticalCss }: IndexProps ) => {
	const [ alreadyResumed, setAlreadyResumed ] = useState( false );
	const resume = useCallback( () => {
		if ( alreadyResumed ) {
			return;
		}
		setAlreadyResumed( true );

		if (
			! criticalCss.criticalCssState ||
			criticalCss.criticalCssState.status === 'not_generated'
		) {
			return regenerateCriticalCss();
		}
		continueGeneratingLocalCriticalCss( criticalCss.criticalCssState );
	}, [ alreadyResumed, criticalCss.criticalCssState ] );

	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );
	const lazyLoadLink = getRedirectUrl( 'jetpack-boost-lazy-load' );
	const learnLazyLoadDeprecation = () => {
		window.open( getRedirectUrl( 'jetpack-boost-lazy-load-deprecation' ), '_blank' );
	};

	const [ lazyLoadState ] = useModuleState( 'lazy_images' );
	const [ cloudCssState ] = useModuleState( 'cloud_css' );
	const [ isaState ] = useModuleState( 'image_size_analysis' );

	const lazyLoadDeprecationMessage = lazyLoadState?.available
		? __(
				'Modern browsers now support lazy loading, and WordPress itself bundles lazy loading for images. This feature will consequently be removed from Jetpack Boost.',
				'jetpack-boost'
		  )
		: __(
				'Modern browsers now support lazy loading, and WordPress itself bundles lazy loading for images. This feature has been disabled to avoid potential conflicts with Gutenberg 16.6.0+ or WordPress 6.4+. This feature will consequently be removed from Jetpack Boost.',
				'jetpack-boost'
		  );

	const [ { data: suggestRegenerate } ] = useSuggestRegenerate();
	const [ { data: premiumFeatures } ] = useDataSync(
		'jetpack_boost_ds',
		'premium_features',
		z.array( z.string() )
	);

	return (
		<div className="jb-container--narrow">
			<Module
				slug="critical_css"
				title={ __( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' ) }
				onDisable={ () => setAlreadyResumed( false ) }
				onEnable={ resume }
				onMountEnable={ resume }
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
									`<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
									'jetpack-boost'
								),
								{
									b: <b />,
								}
							) }
						</p>
					</>
				}
			>
				<CriticalCssMeta
					cssState={ criticalCss.criticalCssState }
					isCloudCssAvailable={ cloudCssState?.available === true }
					criticalCssProgress={ criticalCss.criticalCssProgress }
					issues={ criticalCss.criticalCssIssues }
					isFatalError={ criticalCss.isFatalError }
					primaryErrorSet={ criticalCss.primaryErrorSet }
					suggestRegenerate={ suggestRegenerate }
					regenerateCriticalCss={ criticalCss.regenerateCriticalCss }
				/>
				<RegenerateCriticalCssSuggestion
					show={ suggestRegenerate && criticalCss.criticalCssState.status !== 'pending' }
					type={ suggestRegenerate }
				/>
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
						<span className="jb-badge">Upgraded</span>
					</>
				}
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
				onEnable={ startPollingCloudStatus }
				onDisable={ stopPollingCloudCssStatus }
				onMountEnable={ startPollingCloudStatus }
			>
				<CloudCssMeta
					cssState={ criticalCss.criticalCssState }
					isCloudCssAvailable={ cloudCssState?.available === true }
					criticalCssProgress={ criticalCss.criticalCssProgress }
					issues={ criticalCss.criticalCssIssues }
					isFatalError={ criticalCss.isFatalError }
					primaryErrorSet={ criticalCss.primaryErrorSet }
					suggestRegenerate={ suggestRegenerate }
					regenerateCriticalCss={ regenerateCriticalCss }
				/>
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
				slug="lazy_images"
				title={ __( 'Lazy Image Loading', 'jetpack-boost' ) }
				description={
					<>
						<p>
							{ createInterpolateElement(
								__(
									`Improve page loading speed by only loading images when they are required. Read more on <link>web.dev</link>.`,
									'jetpack-boost'
								),
								{
									// eslint-disable-next-line jsx-a11y/anchor-has-content
									link: <a href={ lazyLoadLink } target="_blank" rel="noopener noreferrer" />,
								}
							) }
						</p>
						<Notice
							level="info"
							title={ __( 'Lazy image loading is going away', 'jetpack-boost' ) }
							hideCloseButton={ true }
							actions={ [
								<Button
									key="learn-more"
									isPrimary={ true }
									onClick={ learnLazyLoadDeprecation }
									isExternalLink={ true }
									variant="link"
								>
									{ __( 'Learn more', 'jetpack-boost' ) }
								</Button>,
							] }
						>
							{ lazyLoadDeprecationMessage }
						</Notice>
					</>
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
				<QualitySettings isPremium={ premiumFeatures?.includes( 'image-cdn-quality' ) ?? false } />
			</Module>

			<div className={ styles.settings }>
				<Module
					slug="image_guide"
					title={
						<>
							{ __( 'Image Guide', 'jetpack-boost' ) }
							<span className={ styles.beta }>Beta</span>
						</>
					}
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
					{ '{false === Jetpack_Boost.site.canResizeImages && <ResizingUnavailable />' }
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
					{ `modulesState.image_size_analysis.active && (
							<RecommendationsMeta
								isaSummary={isaSummary}
								isCdnActive={modulesState.image_cdn.active}
							/>
						) ` }
				</Module>
			</div>
		</div>
	);
};

export default function ( props: IndexProps ) {
	return (
		<DataSyncProvider>
			<Index { ...props } />
		</DataSyncProvider>
	);
}
