<script lang="ts">
	import ChevronLeft from '../../../svg/chevron-left.svg';
	import ChevronRight from '../../../svg/chevron-right.svg';
	import { imageData } from '../store/isa-data';
	// "-1" is replaced by "..." when rendering the pagination
	const MORE_ICON = -1;

	// Given a number, this creates an array of page numbers around it
	// Returns An array of page numbers that are within given range.
	function slidingWindow( currentPage: number, maxPage: number, windowSize = 8 ): number[] {
		// Calculate the first page number in the sliding window.
		const first = Math.max(
			1,
			Math.min( maxPage - windowSize, currentPage - Math.floor( windowSize / 2 ) )
		);

		// Calculate the last page number in the sliding window.
		const last = Math.min( maxPage, first + windowSize );

		// Create an array of page numbers in the sliding window,
		// initialized with zeros and then replaced with actual values
		// based on the first and last page numbers.
		return new Array( last - first + 1 ).fill( 0 ).map( ( _, i ) => first + i );
	}

	function generatePagination( currentPage, maxPage ) {
		const padding = 2;
		const pagination = slidingWindow( currentPage, maxPage );

		// Prepend "1 ..."
		if ( pagination[ pagination.length - padding ] <= maxPage - padding ) {
			pagination.splice( pagination.length - padding, padding, MORE_ICON, maxPage );
		}

		// Append "... 99"
		if ( pagination[ 0 ] - padding >= 0 ) {
			pagination.splice( 0, padding, 1, MORE_ICON );
		}

		return pagination;
	}

	function nextPage() {
		if ( current < total ) {
			$imageData.query.page += 1;
		}
	}

	function previousPage() {
		if ( current > 1 ) {
			$imageData.query.page -= 1;
		}
	}

	$: current = $imageData.query.page;
	$: total = $imageData.data.total_pages;
	$: pages = generatePagination( current, total );
</script>

<div>
	<button class="jb-chevron" class:inactive={current === 1} on:click={previousPage}>
		<ChevronLeft />
	</button>

	<ul>
		{#each pages as page}
			<li>
				<button
					class:current={page === current}
					disabled={page === MORE_ICON}
					on:click={() => ( $imageData.query.page = page )}
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
		<ChevronRight />
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
