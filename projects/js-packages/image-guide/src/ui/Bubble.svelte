<script lang="ts">
	/* eslint-disable import/no-duplicates -- https://github.com/import-js/eslint-plugin-import/issues/2992 */
	import { createEventDispatcher } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	/* eslint-enable import/no-duplicates */
	import Spinner from './Spinner.svelte';
	import Checkmark from './assets/Checkmark.svelte';
	import type { MeasurableImageStore } from '../stores/MeasurableImageStore';

	export let index: number;
	export let store: MeasurableImageStore;

	let severity: string;
	const oversizedRatio = store.oversizedRatio;
	const isLoading = store.loading;

	$: severity = $oversizedRatio > 4 ? 'high' : $oversizedRatio > 2.5 ? 'medium' : 'normal';
	const scaleTransition = {
		delay: 150 + 50 * index,
		duration: 250,
		y: 2,
		easing: backOut,
	};

	let bubble: HTMLElement;
	const dispatch = createEventDispatcher< { hover: unknown } >();
	function onHover() {
		const rect = bubble.getBoundingClientRect();
		dispatch( 'hover', {
			index,
			position: {
				top: rect.top + rect.height + 10,
				left: rect.left,
			},
		} );
	}
</script>

<!-- Clear up complaints about needing an ARIA role: -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- eslint-disable-next-line svelte/valid-compile -->
<div
	class="jb-ig-bubble interaction-area {severity}"
	bind:this={bubble}
	on:mouseenter={onHover}
	transition:fly={scaleTransition}
>
	<div class="jb-ig-bubble bubble">
		{#if false === $isLoading}
			<div class="jb-ig-bubble bubble-inner">
				<div class="label" in:fade={{ delay: 200, duration: 300 }}>
					{#if $oversizedRatio > 9}
						{Math.floor( $oversizedRatio )}x
					{:else if $oversizedRatio > 0.99}
						{#if severity === 'normal'}
							<Checkmark />
						{:else}
							{$oversizedRatio.toFixed( 1 )}x
						{/if}
					{:else}
						<span style="font-size: 0.75em;">&lt;</span> 1x
					{/if}
				</div>
			</div>
		{:else}
			<div class="jb-ig-bubble bubble-inner">
				<Spinner />
			</div>
		{/if}
	</div>
</div>
