<script lang="ts">
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import { modules } from '../../../stores/modules';
	import {
		requestCloudCss,
		pollCloudCssStatus,
		stopPollingCloudCssStatus,
	} from '../../../utils/cloud-css';
	import externalLinkTemplateVar from '../../../utils/external-link-template-var';
	import { maybeGenerateCriticalCss } from '../../../utils/generate-critical-css';
	import CloudCssMeta from '../elements/CloudCssMeta.svelte';
	import CriticalCssMeta from '../elements/CriticalCssMeta.svelte';
	import Module from '../elements/Module.svelte';
	import PremiumCTA from '../elements/PremiumCTA.svelte';
	import ResizingUnavailable from '../elements/ResizingUnavailable.svelte';
	import SuperCacheInfo from '../elements/SuperCacheInfo.svelte';

	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );
	const lazyLoadLink = getRedirectUrl( 'jetpack-boost-lazy-load' );

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	$: cloudCssAvailable = !! $modules[ 'cloud-css' ];
</script>

<div class="jb-container--narrow">
	{#if ! cloudCssAvailable}
		<PremiumCTA />
	{/if}

	<Module
		slug={'critical-css'}
		on:enabled={maybeGenerateCriticalCss}
		on:mountEnabled={maybeGenerateCriticalCss}
	>
		<h3 slot="title">
			{__( 'Optimize CSS Loading', 'jetpack-boost' )}
		</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>Critical CSS</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( criticalCssLink )}
			/>
		</p>

		<div slot="meta">
			<CriticalCssMeta />
		</div>
	</Module>

	<Module
		slug={'cloud-css'}
		on:enabled={requestCloudCss}
		on:disabled={stopPollingCloudCssStatus}
		on:mountEnabled={pollCloudCssStatus}
	>
		<h3 slot="title">
			{__( 'Automatically Optimize CSS Loading', 'jetpack-boost' )}
			<span class="jb-badge">Upgraded</span>
		</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as <link>critical CSS</link> which now generates automatically.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( criticalCssLink )}
			/>
		</p>
		<div slot="meta" class="jb-feature-toggle__meta">
			<CloudCssMeta />
		</div>
	</Module>

	<Module slug={'render-blocking-js'}>
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

	<Module slug={'lazy-images'}>
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
		<Module slug={'image-guide'}>
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
</style>
