<script>
	import { getCurrencyObject } from '@automattic/format-currency';

	export let value;
	export let currency;
	export let isOff;
	export let hidePriceFraction;

	const { symbol, integer, fraction } = getCurrencyObject( value, currency );
	const showPriceFraction = ! hidePriceFraction || ! fraction.endsWith( '00' );
</script>

<p class="jb-price" class:jb-price--not-off-price={! isOff}>
	<sup class="jb-price__symbol">
		{symbol}
	</sup>
	{integer}
	{#if showPriceFraction}
		<sup class="jb-price__fraction">
			<strong>{fraction}</strong>
		</sup>
	{/if}
</p>
