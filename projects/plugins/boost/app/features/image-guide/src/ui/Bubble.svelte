<script lang="ts">
	import { onMount } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let oversizedBy: number;
	export let index: number;

	const severity = oversizedBy > 8 ? 'high' : oversizedBy > 4 ? 'medium' : 'normal';

	let mounted = false;
	onMount( () => ( mounted = true ) );
	const scaleConfig = {
		delay: 150 + 50 * index,
		duration: 250,
		y: 2,
		easing: backOut,
	};

	$: oversizedLabel =
		oversizedBy < 9 ? oversizedBy.toFixed( 1 ) : `${ Math.floor( oversizedBy ) }+`;
</script>

<div class="bubble {severity}" on:mouseenter transition:fly={scaleConfig}>
	<span class="label">{oversizedLabel}</span>
</div>

<style lang="scss">
	.bubble {
		padding: 15px;
		// Offset .guide
		margin-left: -15px;
		margin-top: -15px;
		margin-bottom: -15px;
	}
	.label {
		background-color: #069e08;
		color: white;

		font-weight: 700;
		font-family: sans-serif;
		font-size: 0.8em;

		display: flex;
		justify-content: center;
		align-items: center;

		width: 32px;
		height: 32px;
		border-radius: 50%;
		text-align: center;

		text-shadow: 0 0 1px rgba( 0, 0, 0, 0.25 );
		cursor: default;

		.high & {
			background-color: #e52e00;
		}

		.medium & {
			background-color: #e98800;
		}
	}

	:global( .guide.small ) {
		.bubble {
			padding: 15px;
		}

		.label {
			width: 28px;
			height: 28px;
		}

		font-size: 9px;
	}

	:global( .guide.micro ) {
		.bubble {
			padding: 10px;
			// Offset .guide
			margin-left: -10px;
			margin-top: -10px;
		}
		.label {
			font-size: 0px;
			width: 14px;
			height: 14px;
		}
	}
</style>
