<script>
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { __ } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
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

	const criticalCssLink = getRedirectUrl( 'jetpack-boost-critical-css' );
	const deferJsLink = getRedirectUrl( 'jetpack-boost-defer-js' );
	const lazyLoadlink = getRedirectUrl( 'jetpack-boost-lazy-load' );

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;
</script>

<div class="jb-container--narrow">
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
			<PremiumCTA />
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
				vars={externalLinkTemplateVar( lazyLoadlink )}
			/>
		</p>
	</Module>
</div>
