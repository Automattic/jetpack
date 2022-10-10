<script>
	import { __ } from '@wordpress/i18n';
	import Price from './Price.svelte';

	export let price;
	export let offPrice;
	export let currency = '';
	export let showNotOffPrice = true;
	export let promoLabel = '';
	export let leyend = __( '/month, paid yearly', 'jetpack-boost' );
	export let isNotConvenientPrice = false;
	export let hidePriceFraction = false;
</script>

<template>
	{#if price !== null && offPrice !== null && currency}
		<div class="jb-price__container">
			<Price
				value={offPrice ?? price}
				{currency}
				isOff={! isNotConvenientPrice}
				{hidePriceFraction}
			/>
			{#if showNotOffPrice && offPrice !== null}
				<Price value={price} {currency} isOff={false} {hidePriceFraction} />
			{/if}
			<p class="jb-price__promo-label">{promoLabel}</p>
		</div>

		<p class="jb-price__leyend">{leyend}</p>
	{/if}
</template>
