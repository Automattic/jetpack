<script>
	import { onMount } from 'svelte';
	import { Button } from '@wordpress/components';
	import { __ } from '@wordpress/i18n';
	import BackButton from '../../elements/BackButton.svelte';
	import ReactComponent from '../../elements/ReactComponent.svelte';
	import { updateModuleState } from '../../stores/modules';
	import Logo from '../../svg/jetpack-green.svg';
	import { requestCloudCss } from '../../utils/cloud-css';

	// svelte-ignore unused-export-let - Ignored values supplied by svelte-navigator.
	export let location, navigate;

	onMount( async () => {
		// Enable cloud-css on a successful upgrade.
		await updateModuleState( 'cloud-css', true );
		await requestCloudCss();
	} );
</script>

<div id="jb-settings" class="jb-settings">
	<div class="jb-container jb-container--fixed mt-2">
		<BackButton />
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
					<li>{__( 'Dedicated email support', 'jetpack-boost' )}</li>
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
				<img
					src={`${ window.Jetpack_Boost.site.assetPath }../static/images/boost.png`}
					alt={__( 'Optimize with Jetpack Boost', 'jetpack-boost' )}
				/>
			</div>
		</div>
	</div>
</div>
