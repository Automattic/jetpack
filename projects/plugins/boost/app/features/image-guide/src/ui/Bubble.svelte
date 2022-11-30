<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import type { MeasurableImageStore } from '../MeasurableImageStore';
	import Spinner from './Spinner.svelte';

	export let index: number;
	export let store: MeasurableImageStore;

	let severity: string;
	let oversizedRatio = store.oversizedRatio;
	const isLoading = store.loading;

	$: severity = $oversizedRatio > 4 ? 'high' : $oversizedRatio > 2.5 ? 'medium' : 'normal';
	const scaleTransition = {
		delay: 150 + 50 * index,
		duration: 250,
		y: 2,
		easing: backOut,
	};
</script>

<div class="interaction-area {severity}" on:mouseenter transition:fly={scaleTransition}>
	<div class="bubble">
		{#if false === $isLoading}
			<div class="bubble-inner">
				<div class="label" in:fade={{ delay: 200, duration: 300 }}>
					{#if $oversizedRatio > 9}
						{Math.floor( $oversizedRatio )}x
					{:else if $oversizedRatio > 1}
						{$oversizedRatio.toFixed( 1 )}x
					{:else}
						<span style="font-size: 0.75em;">&lt;</span> 1x
					{/if}
				</div>
			</div>
		{:else}
			<div class="bubble-inner">
				<Spinner />
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	/**
	* This makes it easier to interact with the bable,
	* by setting the interactive area larger than the bubble itself.
	*/
	.interaction-area {
		padding: 15px;
		// Offset .guide
		margin-left: -15px;
		margin-top: -15px;
		margin-bottom: -15px;
	}

	.bubble {
		background-color: #069e08;
		color: white;

		font-weight: 600;
		font-family: sans-serif;
		font-size: 0.8em;

		position: relative;

		width: 32px;
		height: 32px;
		border-radius: 50%;
		text-align: center;

		text-shadow: 0 0 1px rgba( 0, 0, 0, 0.25 );
		cursor: default;
		transition: background-color 300ms ease;

		.high & {
			background-color: #e52e00;
		}

		.medium & {
			background-color: #e98800;
		}
	}

	.bubble-inner {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: auto;
	}

	:global( .guide.small ) {
		.interaction-area {
			padding: 15px;
		}

		.bubble {
			width: 28px;
			height: 28px;
			font-size: 10px;
		}
	}

	:global( .guide.micro ) {
		.interaction-area {
			padding: 10px;
			// Offset .guide
			margin-left: -10px;
			margin-top: -10px;
		}
		.bubble {
			width: 14px;
			height: 14px;
			font-size: 0px;
		}
	}
</style>
