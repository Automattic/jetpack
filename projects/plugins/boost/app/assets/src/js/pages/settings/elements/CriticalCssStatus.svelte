<script lang="ts">
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
	import { regenerateCriticalCss } from '../../../stores/critical-css-state';
	import { CriticalCssState } from '../../../stores/critical-css-state-types';
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import routerHistory from '../../../utils/router-history';

	export let status: CriticalCssState[ 'status' ];
	export let successCount = 0;
	export let updated: CriticalCssState[ 'updated' ];
	export let isCloudCssAvailable = false;
	export let issues: CriticalCssState[ 'providers' ] = [];
	export let progress: number;
	export let suggestRegenerate;
	export let generateText = '';
	export let generateMoreText = '';

	const { navigate } = routerHistory;
</script>

<div class="jb-critical-css__meta">
	<div class="summary">
		{#if ! successCount}
			<div class="generating">{generateText}</div>
		{:else}
			<div class="successes">
				{sprintf(
					/* translators: %d is a number of CSS Files which were successfully generated */
					_n( '%d file generated', '%d files generated', successCount, 'jetpack-boost' ),
					successCount
				)}
				{#if updated}
					<TimeAgo time={new Date( updated * 1000 )} />.
				{/if}
				{#if ! isCloudCssAvailable}
					{__(
						'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
						'jetpack-boost'
					)}
				{/if}
				{#if progress < 100}
					<span>{generateMoreText}</span>
				{/if}
			</div>

			{#if status !== 'pending' && issues.length > 0}
				<div class="failures">
					<InfoIcon />

					<TemplatedString
						template={sprintf(
							/* translators: %d is a number of CSS Files which failed to generate */
							_n(
								'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
								'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
								issues.length,
								'jetpack-boost'
							),
							issues.length
						)}
						vars={{
							...actionLinkTemplateVar( () => navigate( 'critical-css-advanced' ), 'advanced' ),
						}}
					/>
				</div>
			{/if}
		{/if}
	</div>
	{#if status !== 'pending'}
		<button
			type="button"
			class="components-button"
			class:is-link={! suggestRegenerate || isCloudCssAvailable}
			on:click={regenerateCriticalCss}
		>
			<RefreshIcon />
			{__( 'Regenerate', 'jetpack-boost' )}
		</button>
	{/if}
</div>

<style lang="scss">
	:global( .components-button:not( .is-link ) .gridicon ) {
		display: none;
	}

	.components-button:not( .is-link ) {
		color: #fff !important;
		background-color: #000;
		border-radius: 4px;
		border: none;
		font-size: 12px;
		height: 28px;
		padding: 7px 10px;
		text-decoration: none;
		display: inline-block;
	}
</style>
