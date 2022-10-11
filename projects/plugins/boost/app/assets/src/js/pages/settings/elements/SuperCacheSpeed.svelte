<script lang="ts">
	import { compareSuperCacheSpeed } from '../../../utils/measure-super-cache-speed';

	let comparePromise = compareSuperCacheSpeed();
	const superCacheIcon = `${ Jetpack_Boost.site.assetPath }../static/images/super-cache.png`;

	function recheck() {
		comparePromise = compareSuperCacheSpeed();
	}
</script>

<style>
	.super-cache-speed {
		position: relative;
		border: 2px solid #008710;
		background-image: var( --super-cache-icon );
		background-size: auto 100%;
		background-repeat: no-repeat;
		background-color: #272d33;
		width: 80%;
		margin: 20px auto -20px;
		padding: 24px;
		color: white;
		text-align: center;
	}

	a,
	a:hover,
	a:visited {
		display: block;
		position: absolute;
		right: 10px;
		bottom: 10px;
		font-size: 80%;
		color: inherit;
	}
</style>

<div class="super-cache-speed" style="--super-cache-icon: url( {superCacheIcon} )">
	{#await comparePromise}
		Checking the speed of your <b>Super Cache</b>...
	{:then results}
		<b>Super Cache</b> is saving your visitors
		<b>{results.uncached - results.cached} milliseconds</b>

		<a class="recheck" href={'#'} on:click|preventDefault={recheck}>Recheck</a>
	{/await}
</div>
