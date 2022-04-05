<script>
	/**
	 * WordPress dependencies
	 */
	import { __ } from '@wordpress/i18n';

	/**
	 * Internal dependencies
	 */
	import RightArrow from '../../../svg/right-arrow.svg';

	function showBenefits() {
		// Todo: Navigate to Benefits Interstitial.
	}
</script>

<div class="jb-premium-cta" on:click={showBenefits}>
	<div class="jb-premium-cta__content">
		<p>{__( 'Save time by automatically regenerating critical CSS', 'jetpack-boost' )}</p>
		<p class="jb-premium-cta__action-line">{__( 'Upgrade Jetpack Boost', 'jetpack-boost' )}</p>
	</div>
	<div class="jb-premium-cta__icon">
		<RightArrow />
	</div>
</div>
