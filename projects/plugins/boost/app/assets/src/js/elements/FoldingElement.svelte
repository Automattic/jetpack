<script lang="ts">
	export let showLabel;
	export let hideLabel;

	export let visible = false;
</script>

<button
	class="components-button is-link foldable-element-control"
	class:visible
	on:click={() => ( visible = ! visible )}
>
	{visible ? hideLabel : showLabel}
</button>

{#if visible}
	<slot />
{/if}
