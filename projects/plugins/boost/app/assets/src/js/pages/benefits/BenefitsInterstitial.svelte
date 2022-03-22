<script>
	/**
	 * Internal dependencies
	 */
	import BackButton from '../../elements/BackButton.svelte';

	import Logo from '../../svg/jetpack-green.svg';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';
</script>

<div id="jb-settings" class="jb-settings jb-settings--padded">
	<div class="jb-container">
		<BackButton />
		<div class="jb-card">
			<div class="jb-card__content">
				<Logo class="my-3" />
				<h1 class="my-3">{__( "Optimize your website's performance", 'jetpack-boost' )}</h1>
				<p class="jb-card__summary my-3">
					{__(
						'Remove the need to manually regenerate critical CSS after site changes with automated critical CSS.',
						'jetpack-boost'
					)}
				</p>
				<ul class="jb-checklist">
					<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
					<li>{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}</li>
					<li>{__( 'Dedicated email support', 'jetpack-boost' )}</li>
				</ul>
			</div>
		</div>
	</div>
</div>
