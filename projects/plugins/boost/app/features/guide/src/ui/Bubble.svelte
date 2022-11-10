<script lang="ts">
	import { onMount } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let ratio: number;
	export let index: number;
	const severity = ratio > 4 ? 'high' : ratio > 2 ? 'medium' : 'normal';

	let mounted = false;
	onMount(() => (mounted = true));
	const scaleConfig = {
		delay: 50 * index,
		duration: 250,
		y: 2,
		easing: backOut,
	};
</script>

{#if mounted}
	<div class="preview {severity}" on:mouseenter transition:fly={scaleConfig}>
		<div class="bubble">{ratio.toFixed(2)}</div>
	</div>
{/if}

<style lang="scss">
	.preview {
		background-color: #069e08;
		color: white;

		font-weight: 700;
		font-family: sans-serif;
		font-size: 11px;

		padding: 3px;
		width: 32px;
		height: 32px;
		border-radius: 50%;

		display: flex;
		justify-content: center;
		align-items: center;

		text-shadow: 0 0 1px rgba(0, 0, 0, 0.25);
		cursor: default;

		&.high {
			background-color: #e52e00;
		}

		&.medium {
			background-color: #e98800;
		}
	}
</style>
