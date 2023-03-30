<script lang="ts" context="module">
	let alreadyResumed = false;
</script>

<script lang="ts">
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import ReactComponent from '../../../elements/ReactComponent.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import ImageSizeAnalysisView from '../../../modules/image-size-analysis/ModuleView.svelte';
	import { RegenerateCriticalCssSuggestion } from '../../../react-components/RegenerateCriticalCssSuggestion';
	import {
		criticalCssState,
		regenerateLocalCriticalCss,
		regenerateCriticalCss,
	} from '../../../stores/critical-css-state';
	import { suggestRegenerateDS } from '../../../stores/data-sync-client';
	import { isModuleAvailableStore } from '../../../stores/modules';
	import { startPollingCloudStatus, stopPollingCloudCssStatus } from '../../../utils/cloud-css';
	import externalLinkTemplateVar from '../../../utils/external-link-template-var';
	import CloudCssMeta from '../elements/CloudCssMeta.svelte';
	import CriticalCssMeta from '../elements/CriticalCssMeta.svelte';
	import Module from '../elements/Module.svelte';
	import PremiumCTA from '../elements/PremiumCTA.svelte';
	import PremiumTooltip from '../elements/PremiumTooltip.svelte';
	import ResizingUnavailable from '../elements/ResizingUnavailable.svelte';
	import SuperCacheInfo from '../elements/SuperCacheInfo.svelte';

	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );
	const lazyLoadLink = getRedirectUrl( 'jetpack-boost-lazy-load' );
	const minifyCssLink = getRedirectUrl( 'jetpack-boost-minify-css' );

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	$: cloudCssAvailable = isModuleAvailableStore( 'cloud_css' );
	const suggestRegenerate = suggestRegenerateDS.store;

	async function resume() {
		if ( alreadyResumed ) {
			return;
		}
		alreadyResumed = true;

		if ( ! $criticalCssState || $criticalCssState.status === 'not_generated' ) {
			return regenerateCriticalCss();
		}
		await regenerateLocalCriticalCss( $criticalCssState );
	}
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

				<PremiumTooltip />
			</p>
		</div>

		<div slot="meta">
			<CriticalCssMeta />
		</div>

		<div slot="notice">
			<ReactComponent
				this={RegenerateCriticalCssSuggestion}
				show={$suggestRegenerate && $criticalCssState.status !== 'pending'}
			/>
		</div>

		<div slot="cta">
			{#if ! $cloudCssAvailable}
				<PremiumCTA />
			{/if}
		</div>
	</Module>

	<Module
		slug="cloud_css"
		on:enabled={regenerateCriticalCss}
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
			<CloudCssMeta />
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
		</Module>
	</div>

	<Module slug="minify">
		<h3 slot="title">{__( 'Minify', 'jetpack-boost' )}<span class="beta">Beta</span></h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Minimize code and markup in your web pages and script files, reducing file sizes and speeding up your site. Read more on <link>web.dev</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( minifyCssLink )}
			/>
		</p>
	</Module>

	<Module slug="image_size_analysis">
		<h3 slot="title">
			{__( 'Image Size Analysis', 'jetpack-boost' )}<span class="beta">Beta</span>
		</h3>
		<p slot="description">
			{__(
				`This tool will search your site for images that are too large and have an impact your visitors experience, page loading times, and search rankings. Once finished, it will give you a report of all improperly sized images with suggestions on how to fix them.`,
				'jetpack-boost'
			)}
		</p>
		<svelte:fragment slot="meta">
			<ImageSizeAnalysisView />
		</svelte:fragment>
	</Module>

	<Module slug="image-cdn">
		<h3 slot="title">{__( 'Image CDN', 'jetpack-boost' )}<span class="beta">Beta</span></h3>
		<p slot="description">
			{__( `Delivers images from Jetpack's image CDN.`, 'jetpack-boost' )}
		</p>
	</Module>

	<SuperCacheInfo />
</div>

<style lang="scss">
	.settings {
		border-top: 1px solid hsl( 0, 0%, 90% );
		padding-top: 20px;
	}
	.beta {
		background: hsl( 0, 0%, 90% );
		color: hsl( 0, 0%, 20% );
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
