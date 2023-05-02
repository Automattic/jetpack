<script lang="ts">
	const categories = [
		{
			name: 'Homepage',
			count: 2,
		},
		{
			name: 'Pages',
			count: 7,
		},
		{
			name: 'Posts',
			count: 0,
		},
		{
			name: 'Other Content',
			count: 13,
		},
	];

	categories.unshift( {
		name: 'All',
		count: categories.map( category => category.count ).reduce( ( a, b ) => a + b, 0 ),
	} );

	categories.push( {
		name: 'Ignored',
		count: 0,
	} );

	function slugify( str: string ) {
		return str
			.toLowerCase()
			.replace( /[^a-z0-9]+/g, '-' )
			.replace( /^-|-$/g, '' );
	}

	let active = 0;
</script>

<div class="jb-tabs">
	{#each categories as category, key}
		<div class="jb-tab jb-tab--{slugify( category.name )}" class:active={active === key}>
			<div class="jb-tab__header">
				<button on:click={() => ( active = key )}
					>{category.name}
					<span>{category.count}</span>
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
