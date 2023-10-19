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
	<span class="jb-pagination__page jb-pagination__page--inactive">
		<slot />
	</span>
{:else}
	<Link to="/image-size-analysis/{group}/{page}" class="jb-pagination__page">
		<slot />
	</Link>
{/if}
