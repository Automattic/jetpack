<script lang="ts">
	import { getCurrencyObject } from '@automattic/format-currency';
	import { onMount } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import config from '../../../stores/config';
	import RightArrow from '../../../svg/right-arrow.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import routerHistory from '../../../utils/router-history';

	const { navigate } = routerHistory;

	export let description = '';

	onMount( () => {
		// Throw away promise, as we don't need to wait for it.
		void recordBoostEvent( 'view_upsell_cta_in_settings_page_in_plugin', {} );
	} );

	function showBenefits() {
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', eventProps );
		navigate( '/upgrade' );
	}

	$: currencyObjectAfter = getCurrencyObject(
		$config.pricing.yearly.priceAfter / 12,
		$config.pricing.yearly.currencyCode
	);
</script>

<button class="jb-premium-cta" on:click={showBenefits}>
	<div class="jb-premium-cta__content">
		<p>{description}</p>
		<p class="jb-premium-cta__action-line">
			{sprintf(
				/* translators: %s is the price including the currency symbol in front. */
				__( `Upgrade now only %s`, 'jetpack-boost' ),
				currencyObjectAfter.symbol + currencyObjectAfter.integer + currencyObjectAfter.fraction
			)}
		</p>
	</div>
	<div class="jb-premium-cta__icon">
		<RightArrow />
	</div>
</button>
