<script lang="ts">
	import { imageData } from '../store/isa-data';
	import { imageDataGroupTabs } from '../store/isa-groups';
</script>

<div class="jb-tabs">
	{#each Object.entries( $imageDataGroupTabs ) as [key, group]}
		<div class="jb-tab jb-tab--{key}" class:active={$imageData.query.group === key}>
			<div class="jb-tab__header">
				<button on:click={() => ( $imageData.query.group = key )}
					>{group.name}
					<span>{group.issues}</span>
				</button>
			</div>
		</div>
	{/each}
</div>

<style lang="scss">
	.jb-tabs {
		display: flex;
		border-bottom: 1px solid var( --gray-5 );
		margin-bottom: 32px;
		gap: var( --gap );
	}

	.jb-tab {
		min-width: 100px;
		display: flex;
		justify-content: center;
		margin-bottom: -1px; // offset border
		border-bottom: 1px solid transparent;
		&.active {
			border-bottom: 1px solid black;
		}
		&:hover,
		// Accessibility: focus when tabbing to buttons
		&:has( button:focus ) {
			border-bottom: 1px solid var( --gray-40 );
		}
	}
	.jb-tab--ignored {
		margin-left: auto;
	}
	button {
		background: none;
		padding: 10px 16px;
		border: 0;
		cursor: pointer;

		display: flex;
		gap: 10px;
		align-items: center;
		justify-content: center;
		outline: 0;
	}
	.jb-tab span {
		padding: 2px 8px;
		font-size: 0.75rem;
		border-radius: var( --border-radius );
		background-color: var( --gray-5 );
	}
</style>
