<script lang="ts">
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
	import {
		criticalCssProgress,
		criticalCssState,
		regenerateCriticalCss,
	} from '../../../stores/critical-css-state';
	import { criticalCssIssues } from '../../../stores/critical-css-state-errors';
	import { suggestRegenerateDS } from '../../../stores/data-sync-client';
	import { modulesState } from '../../../stores/modules';
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import routerHistory from '../../../utils/router-history';

	export let generateText = '';
	export let generateMoreText = '';
	const { navigate } = routerHistory;
	const suggestRegenerate = suggestRegenerateDS.store;

	$: successCount = $criticalCssState.providers.filter(
		provider => provider.status === 'success'
	).length;
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
				{#if $criticalCssState.updated}
					<TimeAgo time={new Date( $criticalCssState.updated * 1000 )} />.
				{/if}
				{#if ! $modulesState.cloud_css?.available}
					{__(
						'Remember to regenerate each time you make changes that affect your HTML or CSS structure.',
						'jetpack-boost'
					)}
				{/if}
				{#if $criticalCssProgress < 100}
					<span>{generateMoreText}</span>
				{/if}
			</div>

			{#if $criticalCssState.status !== 'pending' && $criticalCssIssues.length > 0}
				<div class="failures">
					<InfoIcon />

					<TemplatedString
						template={sprintf(
							/* translators: %d is a number of CSS Files which failed to generate */
							_n(
								'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
								'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
								$criticalCssIssues.length,
								'jetpack-boost'
							),
							$criticalCssIssues.length
						)}
						vars={{
							...actionLinkTemplateVar( () => navigate( 'critical-css-advanced' ), 'advanced' ),
						}}
					/>
				</div>
			{/if}
		{/if}
	</div>
	{#if $criticalCssState.status !== 'pending'}
		<button
			type="button"
			class="components-button"
			class:is-link={! $suggestRegenerate || $modulesState.cloud_css?.available}
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
