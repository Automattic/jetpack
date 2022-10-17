<script>
	import { __ } from '@wordpress/i18n';
	import RightArrow from '../../../svg/right-arrow.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import routerHistory from '../../../utils/router-history';

	const { navigate } = routerHistory;

	function showBenefits() {
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', eventProps );
		navigate( '/upgrade' );
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
