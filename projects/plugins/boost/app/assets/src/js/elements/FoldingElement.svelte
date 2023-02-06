<script lang="ts">
	export let showLabel: string;
	export let hideLabel: string;
	export let visible = false;

	const toggle = () => ( visible = ! visible );
	$: label = visible ? showLabel : hideLabel;
</script>

<button class="components-button is-link foldable-element-control" class:visible on:click={toggle}>
	{label}
</button>

{#if visible}
	<slot />
{/if}
