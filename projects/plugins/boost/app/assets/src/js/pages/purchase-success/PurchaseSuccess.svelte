<script>
	/**
	 * Internal dependencies
	 */
	import BackButton from '../../elements/BackButton.svelte';

	import Logo from '../../svg/jetpack-green.svg';
	import BoostImage from '../../svg/boost.svg';

	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';
</script>

<div id="jb-settings" class="jb-settings">
	<div class="jb-container jb-container--fixed mt-2">
		<BackButton route="/" />
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
				<ul class="jb-checklist">
					<li>{__( 'Automatic critical CSS regeneration', 'jetpack-boost' )}</li>
					<li>{__( 'Performance scores are recalculated after each change', 'jetpack-boost' )}</li>
					<li>{__( 'Dedicated email support', 'jetpack-boost' )}</li>
				</ul>
			</div>

			<div class="jb-card__cta px-1">
				<BoostImage />
			</div>
		</div>
	</div>
</div>
