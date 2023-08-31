<script lang="ts">
	import { PricingSlider } from '@automattic/jetpack-components';
	import ReactComponent from './ReactComponent.svelte';

	export let valueStore;
	export let minValue;
	export let maxValue;
</script>

<ReactComponent
	this={PricingSlider}
	value={$valueStore}
	{minValue}
	{maxValue}
	onAfterChange={newVal => {
		$valueStore = newVal;
	}}
/>
