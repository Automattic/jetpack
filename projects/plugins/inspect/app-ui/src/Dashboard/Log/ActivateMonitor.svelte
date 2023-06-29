<script lang="ts">
	import Toggle from "../../Components/Toggle.svelte";
	import Filters from "./Filters.svelte";

	export let label: string;
	export let isActive = false;
	export let filter: string;

</script>

<div class="monitor-control">
	<strong>{label}</strong>
	<div class="inline">
		<Toggle id={label} bind:checked={isActive} />
		<Filters bind:filter />
	</div>
</div>

<style>
	strong {
		flex: 2;
		font-size: .85rem;
	}
	.inline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex: 5;
	}
	.monitor-control {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 10px;
	}
</style>
