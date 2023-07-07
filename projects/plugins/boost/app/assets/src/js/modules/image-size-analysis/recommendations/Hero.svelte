<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { isaData } from '../store/isa-data';
	import { imageDataActiveGroup } from '../store/isa-summary';

	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );
</script>

{#if $imageDataActiveGroup && $isaData.data.last_updated}
	{@const  lastUpdated = formatter.format( $isaData.data.last_updated ) }

	<div class="jb-hero" in:fade={{ duration: 300, easing: quadOut }}>
		<span>Latest report as of {lastUpdated}</span>
		{#if $imageDataActiveGroup.issue_count}
			<h1>
				{$imageDataActiveGroup.issue_count}
				Image Recommendations
			</h1>
		{/if}
	</div>
{:else}
	<div class="jb-hero">
		<span>&nbsp;</span>
		<h1>&nbsp;</h1>
	</div>
{/if}

<style lang="scss">
	.jb-hero {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
