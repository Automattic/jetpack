<script lang="ts">
	import ChevronLeft from '../../../svg/chevron-left.svg';
	import ChevronRight from '../../../svg/chevron-right.svg';
	import { Link } from '../../../utils/router';
	import PaginationArrow from './components/PaginationArrow.svelte';

	export let group: string;
	export let current: number;
	export let total: number;

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

	$: pages = generatePagination( current, total );
</script>

<div class="jb-pagination">
	{#if total > 1}
		<PaginationArrow direction="left" {group} {current} {total}>
			<ChevronLeft />
		</PaginationArrow>

		<ul>
			{#each pages as page}
				<li>
					{#if page === MORE_ICON}
						<span class="jb-pagination__page jb-pagination__more"> ... </span>
					{:else}
						<Link
							to="/image-size-analysis/{group}/{page}"
							class="jb-pagination__page{page === current ? ' jb-pagination__current' : ''}"
						>
							{page}
						</Link>
					{/if}
				</li>
			{/each}
		</ul>

		<PaginationArrow direction="right" {group} {current} {total}>
			<ChevronRight />
		</PaginationArrow>
	{/if}
</div>

<style lang="scss">
	.jb-pagination {
		padding: 48px;
	}
	.jb-pagination,
	ul {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	li {
		list-style-type: none;
		margin: 0;
	}

	.jb-pagination__page,
	.jb-pagination :global( a ) {
		background-color: transparent;
		border: 0;
		cursor: pointer;
		padding: 7px 12px;
		aspect-ratio: 1;
		line-height: 1;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;

		&[disabled] {
			cursor: default;
			color: #000;
		}

		&.jb-pagination__inactive {
			opacity: 0.25;
			cursor: not-allowed;
		}
	}

	.jb-pagination :global( .jb-pagination__current ) {
		background-color: #000;
		border-radius: var( --border-radius );
		cursor: pointer;
		border: 0;
		color: #fff;
	}
</style>
