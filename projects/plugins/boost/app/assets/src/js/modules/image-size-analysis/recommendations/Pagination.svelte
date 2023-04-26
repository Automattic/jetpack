<script lang="ts">
	import { onMount } from 'svelte';
	import { imageStore } from '../ApiMock';

	$: current = $imageStore.pagination.current;
	$: total = $imageStore.pagination.total;
	$: pages = Array.from( { length: total }, ( _, i ) => i + 1 );

	function nextPage() {
		if ( current < total ) {
			$imageStore.pagination.current += 1;
		}
	}

	function previousPage() {
		if ( current > 1 ) {
			$imageStore.pagination.current -= 1;
		}
	}
</script>

<div>
	<button class="jb-chevron" class:inactive={current === 1} on:click={previousPage}>
		<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M6.44509 13.0045L0.98645 6.99999L6.44509 0.995483L7.555 2.00449L3.01364 6.99999L7.555 11.9955L6.44509 13.0045Z"
				fill="#1E1E1E"
			/>
		</svg>
	</button>

	<ul>
		{#each pages as page}
			<li>
				<button
					class:current={page === current}
					on:click={() => ( $imageStore.pagination.current = page )}>{page}</button
				>
			</li>
		{/each}
	</ul>

	<button class="jb-chevron" class:inactive={current === total} on:click={nextPage}>
		<svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1.5 12.5L6.5 6.99998L1.5 1.5" stroke="#1E1E1E" stroke-width="1.5" />
		</svg>
	</button>
</div>

<style lang="scss">
	div {
		padding: 48px;
	}
	div,
	ul {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	li {
		list-style-type: none;
		margin: 0;
	}
	.current {
		background-color: #000;
		border-radius: var( --border-radius );
		color: #fff;
		cursor: pointer;
		border: 0;
	}

	button {
		background-color: transparent;
		border: 0;
		cursor: pointer;
		padding: 7px 12px;
		aspect-ratio: 1;
		line-height: 1;
		font-size: 13px;
		font-weight: 600;

		&.inactive {
			opacity: 0.25;
			cursor: not-allowed;
		}
	}
</style>
