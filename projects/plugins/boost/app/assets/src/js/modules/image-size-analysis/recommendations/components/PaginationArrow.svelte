<script lang="ts">
	import { Link } from '../../../../utils/router';

	export let group: string;
	export let direction: 'left' | 'right';
	export let current: number;
	export let total: number;

	$: inactive = direction === 'left' ? current === 1 : current === total;
	$: page = direction === 'left' ? current - 1 : current + 1;
</script>

{#if inactive}
	<span class="jb-pagination__page jb-pagination__inactive">
		<slot />
	</span>
{:else}
	<Link to="/image-size-analysis/{group}/{page}" class="jb-pagination__page">
		<slot />
	</Link>
{/if}

<style lang="scss">
	.jb-pagination__page {
		background-color: transparent;
		border: 0;
		cursor: pointer;
		padding: 7px 12px;
		aspect-ratio: 1;
		line-height: 1;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;

		&.jb-pagination__inactive {
			opacity: 0.25;
			cursor: not-allowed;
		}
	}
</style>
