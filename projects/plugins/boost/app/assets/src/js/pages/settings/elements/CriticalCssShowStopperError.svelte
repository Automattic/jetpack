<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import FoldingElement from '../../../elements/FoldingElement.svelte';
	import { primaryErrorSet } from '../../../stores/critical-css-recommendations';
	import { criticalCssStatus } from '../../../stores/critical-css-status';
	import CriticalCssErrorDescription from './CriticalCssErrorDescription.svelte';

	export let supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/';

	// Show a Provider Key error if the process succeeded but there were errors.
	let showingProviderError = false;
	$: showingProviderError = $primaryErrorSet && $criticalCssStatus.status === 'success';

	const title = __( 'Failed to generate Critical CSS', 'jetpack-boost' );

	const dispatch = createEventDispatcher();

	/**
	 * When users click "refresh" on a showstopper, track that they have already
	 * tried this approach.
	 */
	function retryShowstopper() {
		dispatch( 'retry' );
	}
</script>

<ErrorNotice {title}>
	<p>
		{$criticalCssStatus.retried_show_stopper
			? __(
					"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
					'jetpack-boost'
			  )
			: __(
					'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
					'jetpack-boost'
			  )}
	</p>

	{#if showingProviderError || $criticalCssStatus.status_error}
		<FoldingElement
			showLabel={__( 'See error message', 'jetpack-boost' )}
			hideLabel={__( 'Hide error message', 'jetpack-boost' )}
		>
			<div class="raw-error" transition:slide|local>
				{#if showingProviderError}
					<CriticalCssErrorDescription
						errorSet={$primaryErrorSet}
						showSuggestion={true}
						showClosingParagraph={false}
						foldRawErrors={false}
						on:retry={retryShowstopper}
					/>
				{:else}
					{$criticalCssStatus.status_error}
				{/if}
			</div>
		</FoldingElement>
	{/if}

	<div slot="actionButton">
		{#if $criticalCssStatus.retried_show_stopper}
			<a class="button button-secondary" href={supportLink} target="_blank">
				{__( 'Contact Support', 'jetpack-boost' )}
			</a>
		{:else}
			<button class="secondary" on:click={retryShowstopper}>
				{__( 'Refresh', 'jetpack-boost' )}
			</button>
		{/if}
	</div>
</ErrorNotice>
