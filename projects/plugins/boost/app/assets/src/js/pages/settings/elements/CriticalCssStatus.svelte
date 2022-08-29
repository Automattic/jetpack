<script>
	import { createEventDispatcher } from 'svelte';
	import { __, _n, sprintf } from '@wordpress/i18n';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import TimeAgo from '../../../elements/TimeAgo.svelte';
	import { criticalCssStatus, failedProviderKeyCount } from '../../../stores/critical-css-status';
	import InfoIcon from '../../../svg/info.svg';
	import RefreshIcon from '../../../svg/refresh.svg';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var';
	import routerHistory from '../../../utils/router-history.ts';

	export let generateText = '';
	export let generateMoreText = '';

	const dispatch = createEventDispatcher();
	const { navigate } = routerHistory;
</script>

<div class="jb-critical-css__meta">
	<div class="summary">
		{#if $criticalCssStatus.success_count === 0}
			<div class="generating">{generateText}</div>
		{:else}
			<div class="successes">
				{sprintf(
					/* translators: %d is a number of CSS Files which were successfully generated */
					_n(
						'%d file generated',
						'%d files generated',
						$criticalCssStatus.success_count,
						'jetpack-boost'
					),
					$criticalCssStatus.success_count
				)}
				<TimeAgo time={new Date( $criticalCssStatus.updated * 1000 )} />.
				{#if $criticalCssStatus.progress < 100}
					<span>{generateMoreText}</span>
				{/if}
			</div>

			{#if $criticalCssStatus.status !== 'requesting' && $failedProviderKeyCount > 0}
				<div class="failures">
					<InfoIcon />

					<TemplatedString
						template={sprintf(
							/* translators: %d is a number of CSS Files which failed to generate */
							_n(
								'%d file could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize this file.',
								'%d files could not be automatically generated. Visit the <advanced>advanced recommendations page</advanced> to optimize these files.',
								$failedProviderKeyCount,
								'jetpack-boost'
							),
							$failedProviderKeyCount
						)}
						vars={{
							...actionLinkTemplateVar( () => navigate( 'critical-css-advanced' ), 'advanced' ),
						}}
					/>
				</div>
			{/if}
		{/if}
	</div>
	{#if $criticalCssStatus.status !== 'requesting'}
		<button type="button" class="components-button is-link" on:click={() => dispatch( 'retry' )}>
			<RefreshIcon />
			{__( 'Regenerate', 'jetpack-boost' )}
		</button>
	{/if}
</div>
