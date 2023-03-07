<script lang="ts">
	import { getCurrencyObject } from '@automattic/format-currency';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';
	import { __, sprintf } from '@wordpress/i18n';
	import config from '../../../stores/config';
	import RightArrow from '../../../svg/right-arrow.svg';
	import { recordBoostEvent } from '../../../utils/analytics';
	import routerHistory from '../../../utils/router-history';

	const { navigate } = routerHistory;
	const pricing = derived( config, $config => $config.pricing );

	onMount( () => {
		// Throw away promise, as we don't need to wait for it.
		void recordBoostEvent( 'view_upsell_cta_in_settings_page_in_plugin', {} );
	} );

	function showBenefits() {
		const eventProps = {};
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', eventProps );
		navigate( '/upgrade' );
	}

	const currencyObjectAfter = getCurrencyObject(
		$pricing.yearly.priceAfter,
		$pricing.yearly.currencyCode
	);
</script>

<button class="jb-premium-cta" on:click={showBenefits}>
	<div class="jb-premium-cta__content">
		<p>{__( 'Save time by upgrading to Automatic Critical CSS generation', 'jetpack-boost' )}</p>
		<p class="jb-premium-cta__action-line">
			{sprintf(
				/* translators: %s is the price including the currency symbol in front. */
				__( `Upgrade now only %s`, 'jetpack-boost' ),
				currencyObjectAfter.symbol + currencyObjectAfter.integer / 12
			)}
		</p>
	</div>
	<div class="jb-premium-cta__icon">
		<RightArrow />
	</div>
</button>
