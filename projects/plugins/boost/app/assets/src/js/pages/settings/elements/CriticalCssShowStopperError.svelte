<script lang="ts" context="module">
	let firstTime = true;
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { slide } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import ErrorNotice from '../../../elements/ErrorNotice.svelte';
	import FoldingElement from '../../../elements/FoldingElement.svelte';
	import { CriticalCssState } from '../../../stores/critical-css-state-types';
	import CriticalCssErrorDescription from './CriticalCssErrorDescription.svelte';

	export let supportLink = 'https://wordpress.org/support/plugin/jetpack-boost/';
	export let status: CriticalCssState[ 'status' ];
	export let primaryErrorSet;
	export let statusError;
	export let regenerateCriticalCss;

	// Show a Provider Key error if the process succeeded but there were errors.
	$: showProviderError = primaryErrorSet && status === 'generated';

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

	{#if showProviderError || statusError}
		<FoldingElement
			showLabel={__( 'See error message', 'jetpack-boost' )}
			hideLabel={__( 'Hide error message', 'jetpack-boost' )}
		>
			<div class="raw-error" transition:slide|local>
				{#if showProviderError}
					<CriticalCssErrorDescription
						errorSet={primaryErrorSet}
						showSuggestion={true}
						showClosingParagraph={false}
						foldRawErrors={false}
					/>
				{:else}
					{statusError}
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
