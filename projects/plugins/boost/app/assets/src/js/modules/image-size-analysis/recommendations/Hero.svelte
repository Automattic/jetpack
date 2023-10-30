<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { __, _n, sprintf } from '@wordpress/i18n';
	import RecommendationContext from '../../../elements/RecommendationContext.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';

	export let needsRefresh: boolean;
	export let refresh: () => Promise< void >;
	export let isImageCdnModuleActive: boolean;
	export let isaLastUpdated: number;
	export let hasActiveGroup: boolean;
	export let totalIssueCount: number;

	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );
</script>

{#if hasActiveGroup && isaLastUpdated}
	{@const  lastUpdated = formatter.format( isaLastUpdated ) }

	<div class="jb-hero" in:fade={{ duration: 300, easing: quadOut }}>
		<span>Latest report as of {lastUpdated}</span>
		{#if totalIssueCount}
			<h1>
				{sprintf(
					/* translators: %d: number of image recommendations */
					_n(
						'%d Image Recommendation',
						'%d Image Recommendations',
						totalIssueCount,
						'jetpack-boost'
					),
					totalIssueCount
				)}

				{#if ! isImageCdnModuleActive && totalIssueCount > 0}
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
