<script>
	import { maybeGenerateCriticalCss } from '../../../utils/generate-critical-css';
	import GenerateCss from '../elements/GenerateCSS.svelte';
	import Module from '../elements/Module.svelte';
	import { __ } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import externalLinkTemplateVar from '../../../utils/external-link-template-var';
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
					`Move important styling information to the start of the
					page, which helps pages display your content sooner, so
					your users don’t have to wait for the entire page to
					load. Commonly referred to as <link>Critical CSS</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( 'https://web.dev/extract-critical-css/' )}
			/>
		</p>

		<div slot="meta">
			<GenerateCss />
		</div>
	</Module>

	<Module slug={'render-blocking-js'}>
		<h3 slot="title">
			{__( 'Defer Non-Essential JavaScript', 'jetpack-boost' )}
		</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Run non-essential JavaScript after the page has loaded so
					that styles and images can load more quickly. Read more on
					<link>web.dev</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( 'https://web.dev/efficiently-load-third-party-javascript/' )}
			/>
		</p>
	</Module>

	<Module slug={'lazy-images'}>
		<h3 slot="title">{__( 'Lazy Image Loading', 'jetpack-boost' )}</h3>
		<p slot="description">
			<TemplatedString
				template={__(
					`Improve page loading speed by only loading images when they
					are required. Read more on <link>web.dev</link>.`,
					'jetpack-boost'
				)}
				vars={externalLinkTemplateVar( 'https://web.dev/browser-level-image-lazy-loading/' )}
			/>
		</p>
	</Module>
</div>
