<script lang="ts">
	export let url: string;
	export let title: string;
	export let width: number;
	export let height: number;
</script>

{#if url && title}
	<img src={url} alt={title} {width} {height} class="jb-thumbnail__image--missing" />
{:else}
	<div class="jb-thumbnail__placeholder" style:--thumbnail-size="{width}px" />
{/if}
