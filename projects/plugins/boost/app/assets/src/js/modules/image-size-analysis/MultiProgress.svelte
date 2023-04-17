<script lang="ts">
	import { sprintf, __ } from '@wordpress/i18n';
	import ProgressBar from '../../elements/ProgressBar.svelte';
	import Spinner from '../../elements/Spinner.svelte';
	import { categories } from './ApiMock';
</script>

<div class="jb-multi-progress">
	{#each $categories as category, index}
		<div class="jb-entry">
			<div class="jb-progress">
				<ProgressBar progress={category.progress} />
			</div>
			{#if ! category.done && category.progress > 0}
				<Spinner />
			{:else}
				<span class="jb-bubble" class:done={category.done}>
					{#if category.done}
						✓
					{:else}
						{index + 1}
					{/if}
				</span>
			{/if}
			<div class="jb-category-name">
				{category.name}
			</div>
			{#if category.done || category.issues > 0}
				<div class="jb-status" class:has-issues={category.issues > 0}>
					{#if category.issues > 0}
						{sprintf(
							/* translators: %d is the number of items in this list hidden behind this link */
							__( '%d issues', 'jetpack-boost' ),
							category.issues
						)}
					{:else}
						{__( 'No issues', 'jetpack-boost' )}
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	.jb-multi-progress {
		width: 100%;
		display: flex;
		gap: 8px;
	}
	.jb-progress {
		grid-area: progress;
	}
	.jb-entry {
		flex: 1 0;
		display: grid;
		gap: 4px;
		grid-template-columns: 30px 1fr 1fr;
		grid-template-rows: 36px 18px 18px;
		grid-template-areas:
			'progress progress progress'
			'bubble category category'
			'bubble status status';
	}
	.jb-bubble {
		grid-area: bubble;
		background-color: var( --gray-50 );
		color: var( --gray-0 );
		border-radius: 50%;
		width: 1.6rem;
		height: 1.6rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		&.done {
			background-color: var( --jetpack-green-50 );
		}
	}
	.jb-status {
		grid-area: status;
		font-size: 0.875rem;
		&.has-issues {
			color: var( --color_warning );
		}
	}
	.jb-category-name {
		grid-area: category;
		display: flex;
	}
</style>
