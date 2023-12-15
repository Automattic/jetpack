<script lang="ts" context="module">
	let alreadyResumed = false;
</script>

<script lang="ts">
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { onMount } from 'svelte';
	import { __ } from '@wordpress/i18n';
	import RecommendationsMeta from '$features/image-size-analysis/RecommendationsMeta.svelte';
	import {
		initializeIsaSummary,
		isaSummary,
	} from '$features/image-size-analysis/lib/stores/isa-summary';
	import Notice from '$features/Notice.svelte';
	import ReactComponent from '$features/ReactComponent.svelte';
	import TemplatedString from '$features/TemplatedString.svelte';
	import CloudCssMeta from '$features/critical-css/cloud-css-meta/cloud-css-meta';
	import CriticalCssMeta from '$features/critical-css/critical-css-meta/critical-css-meta';
	import MinifyMeta from '$features/minify-meta/minify-meta';
	import Module from '$features/Module.svelte';
	import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
	import { RegenerateCriticalCssSuggestion } from '$features/critical-css';
	import ResizingUnavailable from '../../features/ResizingUnavailable.svelte';
	import SuperCacheInfo from '$features/super-cache-info/super-cache-info';
	import UpgradeCTA from '$features/UpgradeCTA.svelte';
	import config from '$lib/stores/config';
	import {
		criticalCssState,
		continueGeneratingLocalCriticalCss,
		regenerateCriticalCss,
		criticalCssProgress,
		isFatalError,
		criticalCssIssues,
		primaryErrorSet,
	} from '$features/critical-css';
	import { suggestRegenerateDS } from '$features/critical-css';
	import { modulesState } from '$lib/stores/modules';
	import { premiumFeatures } from '$lib/stores/premium-features';
	import {
		startPollingCloudStatus,
		stopPollingCloudCssStatus,
	} from '$features/critical-css/lib/cloud-css';
	import externalLinkTemplateVar from '$lib/utils/external-link-template-var';
	import { QualitySettings } from '$features/image-cdn';

	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );
	const lazyLoadLink = getRedirectUrl( 'jetpack-boost-lazy-load' );
	const learnLazyLoadDeprecation = () => {
		window.open( getRedirectUrl( 'jetpack-boost-lazy-load-deprecation' ), '_blank' );
	};

	$: lazyLoadDeprecationMessage = $modulesState.lazy_images?.available
		? __(
				'Modern browsers now support lazy loading, and WordPress itself bundles lazy loading for images. This feature will consequently be removed from Jetpack Boost.',
				'jetpack-boost'
		  )
		: __(
				'Modern browsers now support lazy loading, and WordPress itself bundles lazy loading for images. This feature has been disabled to avoid potential conflicts with Gutenberg 16.6.0+ or WordPress 6.4+. This feature will consequently be removed from Jetpack Boost.',
				'jetpack-boost'
		  );

	const suggestRegenerate = suggestRegenerateDS.store;

	$: yearlyPricing = $config.pricing.yearly;

	async function resume() {
		if ( alreadyResumed ) {
			return;
		}
		alreadyResumed = true;

		if ( ! $criticalCssState || $criticalCssState.status === 'not_generated' ) {
			return regenerateCriticalCss();
		}
		await continueGeneratingLocalCriticalCss( $criticalCssState );
	}

	onMount( () => {
		if ( $modulesState.image_size_analysis.active ) {
			initializeIsaSummary();
		}
	} );
</script>

<div class="jb-container--narrow">
	<Module
		slug="critical_css"
		on:enabled={resume}
		on:mountEnabled={resume}
		on:disabled={() => ( alreadyResumed = false )}
	>
		<h3 slot="title">
			{__( 'Optimize Critical CSS Loading (manual)', 'jetpack-boost' )}
		</h3>

		<div slot="description">
			<p>
				<TemplatedString
					template={__(
						`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.`,
						'jetpack-boost'
					)}
					vars={externalLinkTemplateVar( criticalCssLink )}
				/>
			</p>

			<p>
				<TemplatedString
					template={__(
						`<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
						'jetpack-boost'
					)}
					vars={{
						b: [ 'strong', {}, '' ],
					}}
				/>
				<ReactComponent inline this={PremiumTooltip} />
			</p>
		</div>

		<div slot="meta">
			<ReactComponent
				this={CriticalCssMeta}
				cssState={$criticalCssState}
				isCloudCssAvailable={$modulesState.cloud_css?.available}
				criticalCssProgress={$criticalCssProgress}
				issues={$criticalCssIssues}
				isFatalError={$isFatalError}
				primaryErrorSet={$primaryErrorSet}
				suggestRegenerate={$suggestRegenerate}
				{regenerateCriticalCss}
			/>
		</div>

		<div slot="notice">
			<ReactComponent
				this={RegenerateCriticalCssSuggestion}
				show={$suggestRegenerate && $criticalCssState.status !== 'pending'}
				type={$suggestRegenerate}
			/>
		</div>

		<svelte:fragment slot="cta">
			<UpgradeCTA
				description={__(
					'Save time by upgrading to Automatic Critical CSS generation.',
					'jetpack-boost'
				)}
				{yearlyPricing}
			/>
		</svelte:fragment>
	</Module>

	<Module
		slug="cloud_css"
		on:enabled={startPollingCloudStatus}
		on:disabled={stopPollingCloudCssStatus}
		on:mountEnabled={startPollingCloudStatus}
	>
		<h3 slot="title">
			{__( 'Automatically Optimize CSS Loading', 'jetpack-boost' )}
			<span class="jb-badge">Upgraded</span>
		</h3>
		<div slot="description">
			<p>
				<TemplatedString
					template={__(
						`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.`,
						'jetpack-boost'
					)}
					vars={externalLinkTemplateVar( criticalCssLink )}
				/>
			</p>

			<p>
				<TemplatedString
					template={__(
						`<b>Boost will automatically generate your Critical CSS</b> whenever you make changes to the HTML or CSS structure of your site.`,
						'jetpack-boost'
					)}
					vars={{
						b: [ 'strong', {}, '' ],
					}}
				/>
			</p>
		</div>

		<div slot="meta" class="jb-feature-toggle__meta">
			<ReactComponent
				this={CloudCssMeta}
				cssState={$criticalCssState}
				isCloudCssAvailable={$modulesState.cloud_css?.available}
				criticalCssProgress={$criticalCssProgress}
				issues={$criticalCssIssues}
				isFatalError={$isFatalError}
				primaryErrorSet={$primaryErrorSet}
				suggestRegenerate={$suggestRegenerate}
				{regenerateCriticalCss}
			/>
		</div>
	</Module>

	<Module slug="render_blocking_js">
		<h3 slot="title">
			{__( 'Defer Non-Essential JavaScript', 'jetpack-boost' )}
		</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly. Read more on <link>web.dev</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( deferJsLink )}
			/>
		</p>
	</Module>

	<Module slug="lazy_images">
		<h3 slot="title">{__( 'Lazy Image Loading', 'jetpack-boost' )}</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Improve page loading speed by only loading images when they are required. Read more on <link>web.dev</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( lazyLoadLink )}
			/>
		</p>
		<Notice
			title={__( 'Lazy image loading is going away', 'jetpack-boost' )}
			message={lazyLoadDeprecationMessage}
			actions={[
				{
					label: __( 'Learn more', 'jetpack-boost' ),
					onClick: learnLazyLoadDeprecation,
					isExternalLink: true,
					variant: 'link',
				},
			]}
		/>
	</Module>

	<Module slug="minify_js">
		<h3 slot="title">{__( 'Concatenate JS', 'jetpack-boost' )}</h3>
		<p slot="description">
			{__(
				'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
				'jetpack-boost'
			)}
		</p>
		<div slot="meta">
			<ReactComponent
				this={MinifyMeta}
				datasyncKey="minify_js_excludes"
				inputLabel={__( 'Exclude JS Strings:', 'jetpack-boost' )}
				buttonText={__( 'Exclude JS Strings', 'jetpack-boost' )}
				placeholder={__( 'Comma separated list of JS scripts to exclude', 'jetpack-boost' )}
			/>
		</div>
	</Module>

	<Module slug="minify_css">
		<h3 slot="title">{__( 'Concatenate CSS', 'jetpack-boost' )}</h3>
		<p slot="description">
			{__(
				'Styles are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
				'jetpack-boost'
			)}
		</p>

		<div slot="meta">
			<ReactComponent
				this={MinifyMeta}
				datasyncKey="minify_css_excludes"
				inputLabel={__( 'Exclude CSS Strings:', 'jetpack-boost' )}
				buttonText={__( 'Exclude CSS Strings', 'jetpack-boost' )}
				placeholder={__( 'Comma separated list of CSS stylesheets to exclude', 'jetpack-boost' )}
			/>
		</div>
	</Module>

	<Module slug="image_cdn">
		<h3 slot="title">{__( 'Image CDN', 'jetpack-boost' )}</h3>
		<p slot="description">
			{__(
				`Deliver images from Jetpack's Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.`,
				'jetpack-boost'
			)}
		</p>

		<div slot="meta">
			<ReactComponent
				this={QualitySettings}
				isPremium={$premiumFeatures.includes( 'image-cdn-quality' )}
			/>
		</div>
	</Module>

	<div class="settings">
		<Module slug="image_guide">
			<h3 slot="title">{__( 'Image Guide', 'jetpack-boost' )}<span class="beta">Beta</span></h3>
			<p slot="description">
				{__(
					`This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.`,
					'jetpack-boost'
				)}
			</p>
			<!-- svelte-ignore missing-declaration -->
			{#if false === Jetpack_Boost.site.canResizeImages}
				<ResizingUnavailable />
			{/if}

			<svelte:fragment slot="cta">
				{#if ! $modulesState.image_size_analysis.available}
					<UpgradeCTA
						description={__(
							'Upgrade to scan your site for issues - automatically!',
							'jetpack-boost'
						)}
						{yearlyPricing}
					/>
				{/if}
			</svelte:fragment>
		</Module>

		<Module slug="image_size_analysis" toggle={false}>
			<h3 slot="title">
				{__( 'Image Size Analysis', 'jetpack-boost' )}<span class="beta">Beta</span>
			</h3>
			<p slot="description">
				{__(
					`This tool will search your site for images that are too large and have an impact on your visitors' experience, page loading times, and search rankings. Once finished, it will give you a report of all improperly sized images with suggestions on how to fix them.`,
					'jetpack-boost'
				)}
			</p>

			<svelte:fragment slot="meta">
				{#if $modulesState.image_size_analysis.active}
					<RecommendationsMeta
						isaSummary={$isaSummary}
						isCdnActive={$modulesState.image_cdn.active}
					/>
				{/if}
			</svelte:fragment>
		</Module>
	</div>

	<ReactComponent this={SuperCacheInfo} />
</div>

<style lang="scss">
	.settings {
		border-top: 1px solid hsl( 0, 0%, 90% );
		padding-top: 20px;
	}
	.beta {
		background: var( --jp-green-5 );
		color: var( --jp-green-60 );
		padding: 2px 5px;
		border-radius: 3px;
		font-size: 0.8rem;
		margin-left: 10px;
		transform: translateY( -4.5px );
		display: inline-block;
	}

	[slot='notice'] {
		margin-top: 1rem;
	}
</style>
