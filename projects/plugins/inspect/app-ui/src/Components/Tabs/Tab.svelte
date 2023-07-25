<script>
	import { getContext } from "svelte";
	import { TABS } from "./Tabs.svelte";

	const tab = {};
	const { registerTab, selectTab, selectedTab } = getContext(TABS);

	registerTab(tab);
</script>

<button class:selected={$selectedTab === tab} on:click={() => selectTab(tab)}>
	<slot />
</button>

<style>
	button {
		background: none;
		border: none;
		border-bottom: 2px solid white;
		border-radius: 0;
		margin: 0;
		opacity: 0.5;
		padding: 7px 11px;
		cursor: pointer;
	}

	.selected {
		border-bottom: 2px solid var(--jetpack-green);
		transform: translateY(2px);
		opacity: 1;
	}
</style>
