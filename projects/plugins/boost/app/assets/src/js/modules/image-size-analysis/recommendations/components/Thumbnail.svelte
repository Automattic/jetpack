<script lang="ts">
	export let url: string;
	export let title: string;
	export let width: number;
	export let height: number;
</script>

{#if url && title}
	<img src={url} alt={title} {width} {height} />
{:else}
	<div class="jb-thumbnail-placeholder" style:--thumbnail-size="{width}px" />
{/if}

<style lang="scss">
	img {
		display: block;
		border-radius: 3px;
	}
	.jb-thumbnail-placeholder {
		width: var( --thumbnail-size );
		height: var( --thumbnail-size );
		background-color: var( --gray-5 );
		border-radius: 3px;
	}
</style>
