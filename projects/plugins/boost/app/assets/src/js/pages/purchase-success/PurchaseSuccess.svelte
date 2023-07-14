<script lang="ts">
	import { getRedirectUrl } from '@automattic/jetpack-components';
	import { onMount } from 'svelte';
	import { Button } from '@wordpress/components';
	import { __ } from '@wordpress/i18n';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import TemplatedString from '../../elements/TemplatedString.svelte';
	import { requestImageAnalysis } from '../../modules/image-size-analysis/store/isa-summary';
	import { regenerateCriticalCss } from '../../stores/critical-css-state';
	import { modulesState } from '../../stores/modules';
	import Logo from '../../svg/jetpack-green.svg';
	import externalLinkTemplateVar from '../../utils/external-link-template-var';

	const wpcomPricingUrl = getRedirectUrl( 'wpcom-pricing' );

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	onMount( async () => {
		$modulesState.cloud_css.active = true;
		await regenerateCriticalCss();

		// If image guide is enabled, request a new ISA report.
		if ( $modulesState.image_guide.active ) {
			// Check if images can be resized.
			if ( false !== Jetpack_Boost.site.canResizeImages ) {
				await requestImageAnalysis();
			}
		}
	} );
</script>

<div id="jb-dashboard" class="jb-dashboard">
	<div class="jb-container jb-container--fixed mt-2">
		<div class="jb-card">
			<div class="jb-card__content">
				<Logo class="my-2" />
				<h1 class="my-2">{__( 'Your Jetpack Boost has been upgraded!', 'jetpack-boost' )}</h1>
				<p class="jb-card__summary my-2">
					{__(
						'When you update your site, it will now be optimized automatically with automated critical CSS',
						'jetpack-boost'
					)}
				</p>
				<ul class="jb-checklist my-2">
					<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
					<li>{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}</li>
					<li>{__( 'Automatically scan your site for image size issues', 'jetpack-boost' )}</li>

					<li>
						<!-- svelte-ignore missing-declaration Jetpack_Boost -->
						{#if Jetpack_Boost.site.isAtomic}
							<TemplatedString
								template={__(
									`Dedicated email support plus priority Live Chat if <link>your plan</link> includes <strong>Premium Support</strong>`,
									'jetpack-boost'
								)}
								vars={externalLinkTemplateVar( wpcomPricingUrl )}
							/>
						{:else}
							{__( 'Dedicated email support', 'jetpack-boost' )}
						{/if}
					</li>
				</ul>
				<ReactComponent
					this={Button}
					label={__( 'Continue', 'jetpack-boost' )}
					onClick={() => navigate( '/' )}
					className="jp-action-button--button jb-button jb-button--primary mt-3"
					children={__( 'Continue', 'jetpack-boost' )}
				/>
			</div>

			<div class="jb-card__cta px-1 py-4">
				<!-- svelte-ignore missing-declaration Jetpack_Boost -->
				<img
					src={`${ Jetpack_Boost.site.assetPath }../static/images/boost.png`}
					alt={__( 'Optimize with Jetpack Boost', 'jetpack-boost' )}
				/>
			</div>
		</div>
	</div>
</div>
