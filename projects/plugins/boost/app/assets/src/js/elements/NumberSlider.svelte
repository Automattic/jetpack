<script lang="ts">
	import { NumberSlider } from '@automattic/jetpack-components';
	import ReactComponent from './ReactComponent.svelte';

	export let valueStore;
	export let minValue;
	export let maxValue;
</script>

<ReactComponent
	this={NumberSlider}
	value={$valueStore}
	{minValue}
	{maxValue}
	onAfterChange={newVal => {
		$valueStore = newVal;
	}}
/>
