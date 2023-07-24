<script lang="ts" context="module">
	let firstTime = true;
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import FoldingElement from '../../../elements/FoldingElement.svelte';
	import { criticalCssState, regenerateCriticalCss } from '../../../stores/critical-css-state';
	import { primaryErrorSet } from '../../../stores/critical-css-state-errors';
	import CriticalCssErrorDescription from './CriticalCssErrorDescription.svelte';

	export let supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/';

	// Show a Provider Key error if the process succeeded but there were errors.
	let showingProviderError = false;
	$: showingProviderError = $primaryErrorSet && $criticalCssState.status === 'generated';
	onDestroy( () => {
		firstTime = false;
	} );
	const title = __( 'Failed to generate Critical CSS', 'jetpack-boost' );
</script>

<ErrorNotice {title}>
	<p>
		{firstTime === false
			? __(
					"Hmm, looks like something went wrong. We're still seeing an unexpected error. Please reach out to our support to get help.",
					'jetpack-boost'
			  )
			: __(
					'An unexpected error has occurred. As this error may be temporary, please try and refresh the Critical CSS.',
					'jetpack-boost'
			  )}
	</p>

	{#if showingProviderError || $criticalCssState.status_error}
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
					/>
				{:else}
					{$criticalCssState.status_error}
				{/if}
			</div>
		</FoldingElement>
	{/if}

	<div slot="actionButton">
		{#if firstTime === false}
			<a class="button button-secondary" href={supportLink} target="_blank" rel="noreferrer">
				{__( 'Contact Support', 'jetpack-boost' )}
			</a>
		{:else}
			<button class="secondary" on:click={regenerateCriticalCss}>
				{__( 'Refresh', 'jetpack-boost' )}
			</button>
		{/if}
	</div>
</ErrorNotice>
