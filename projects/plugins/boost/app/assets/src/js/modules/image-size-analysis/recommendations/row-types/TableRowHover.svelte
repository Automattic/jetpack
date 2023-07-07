<script lang="ts">
	import Button from '../../../../elements/Button.svelte';
	export let edit_url: string | null;
	export let instructions: string;
</script>

<div class="hover">
	<p>{instructions}</p>

	{#if edit_url}
		<div class="button-container">
			<Button small fill href={edit_url}>Edit Page</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	.hover {
		display: flex;
		align-items: center;
		gap: var( --gap );
	}
	p {
		flex-grow: 1;
	}
</style>
