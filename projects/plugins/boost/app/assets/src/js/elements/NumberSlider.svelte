<script lang="ts">
	import { NumberSlider } from '@automattic/jetpack-components';
	import ReactComponent from './ReactComponent.svelte';

	export let currentValue;
	export let minValue;
	export let maxValue;
</script>

<ReactComponent
	this={NumberSlider}
	value={currentValue}
	{minValue}
	{maxValue}
	onAfterChange={newValue => ( currentValue = newValue )}
/>
