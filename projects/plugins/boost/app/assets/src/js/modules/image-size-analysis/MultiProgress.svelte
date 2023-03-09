<script lang="ts">
	import ProgressBar from '../../elements/ProgressBar.svelte';
	import { categories } from './ApiMock';
</script>

<div class="jb-multi-progress">
	{#each $categories as category, index}
		<div class="jb-entry">
			<ProgressBar progress={category.progress} />
			<br />
			<span class="jb-description">
				<span class="jb-bubble">{index + 1}</span>{category.name}
			</span>
		</div>
	{/each}
</div>

<style lang="scss">
	.jb-multi-progress {
		width: 100%;
		display: flex;
		gap: 8px;
	}
	.jb-entry {
		flex: 1 0;
	}
	.jb-bubble {
		background-color: var( --gray-50 );
		color: var( --gray-0 );
		border-radius: 50%;
		width: 1.6rem;
		height: 1.6rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.jb-description {
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
