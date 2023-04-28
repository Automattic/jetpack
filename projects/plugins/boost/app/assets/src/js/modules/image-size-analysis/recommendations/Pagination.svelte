<script lang="ts">
	import { imageStore } from '../ApiMock';

	// "-1" is replaced by "..." when rendering the pagination
	const MORE_ICON = -1;

	function slidingWindow(pages, currentPage) {
		const windowSize = 8;
		const first = Math.max(
			1,
			Math.min(pages - windowSize, currentPage - Math.floor(windowSize / 2))
		);
		const last = Math.min(pages, first + windowSize);

		return new Array(last - first + 1).fill(0).map((_, i) => first + i);
	}

	function generatePagination(current, total) {
		const padding = 2;


		const pagination = slidingWindow(total, current);

		if (pagination[pagination.length - padding] <= total - padding) {
			pagination.splice(pagination.length - padding, padding, MORE_ICON, total);
		}

		if (pagination[0] - padding >= 0) {
			pagination.splice(0, padding, 1, MORE_ICON);
		}

		return pagination;
	}

	function nextPage() {
		if (current < total) {
			$imageStore.pagination.current += 1;
		}
	}

	function previousPage() {
		if (current > 1) {
			$imageStore.pagination.current -= 1;
		}
	}

	$: current = $imageStore.pagination.current;
	$: total = $imageStore.pagination.total;
	$: pages = generatePagination(current, total);

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
					disabled={page === MORE_ICON}
					on:click={() => ($imageStore.pagination.current = page)}
				>
					{#if page === MORE_ICON}
						...
					{:else}
						{page}
					{/if}
				</button>
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
		border-radius: var(--border-radius);
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

		&[disabled] {
			cursor: default;
			color: #000;
		}

		&.inactive {
			opacity: 0.25;
			cursor: not-allowed;
		}
	}
</style>
