<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { __, sprintf } from '@wordpress/i18n';
	import RecommendationContext from '../../../elements/RecommendationContext.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import { modulesState } from '../../../stores/modules';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import { isaData } from '../store/isa-data';
	import { imageDataActiveGroup } from '../store/isa-summary';

	export let needsRefresh: boolean;
	export let refresh: () => Promise< void >;

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
				{sprintf(
					/* translators: %d: number of image recommendations */
					__( '%d Image Recommendations', 'jetpack-boost' ),
					$imageDataActiveGroup.issue_count
				)}

        {#if ! $modulesState.image_cdn.active && $imageDataActiveGroup.issue_count > 0}
					<RecommendationContext />
				{/if}
			</h1>
		{/if}

		{#if needsRefresh}
			<TemplatedString
				template={__(
					'More recommendations have been found. <refresh>Refresh</refresh> to see the latest recommendations.',
					'jetpack-boost'
				)}
				vars={actionLinkTemplateVar( () => refresh(), 'refresh' )}
			/>
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
		padding: 50px 0 30px;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
