<!--
	This Component shows a human-friendly description of a Critical CSS ErrorSet;
	i.e.: a set of URLs from a Provider key which have failed.

	It can include a list of failed URLs, what a user can do, and extra information.
-->
<script>
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	import { __ } from '@wordpress/i18n';
	import FoldingElement from '../../../elements/FoldingElement.svelte';
	import MoreList from '../../../elements/MoreList.svelte';
	import NumberedList from '../../../elements/NumberedList.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import actionLinkTemplateVar from '../../../utils/action-link-template-var.ts';
	import {
		describeErrorSet,
		suggestion,
		footerComponent,
		rawError,
	} from '../../../utils/describe-critical-css-recommendations';
	import supportLinkTemplateVar from '../../../utils/support-link-template-var';

	const dispatch = createEventDispatcher();

	export let showSuggestion = true;
	export let foldRawErrors = true;
	export let showClosingParagraph = true;

	/**
	 * @member {ErrorSet} errorSet Error Set to display a description of, from a Recommendation or CriticalCssStatus.
	 */
	export let errorSet;

	// Keep a set of URLs in an easy-to-render {href:, label:} format.
	// Each should show the URL in its label, but actually link to error.meta.url if available.
	let displayUrls = [];
	$: displayUrls = Object.entries( errorSet.byUrl ).map( ( [ url, error ] ) => ( {
		href: error.meta.url ? error.meta.url : url,
		label: url,
	} ) );

	const templateVars = {
		...actionLinkTemplateVar( () => dispatch( 'retry' ), 'retry' ),
		...supportLinkTemplateVar(),
	};
</script>

<div class="jb-critical-css__error-description">
	<span class="error-description">
		<TemplatedString template={describeErrorSet( errorSet )} vars={{ templateVars }} />
	</span>

	<MoreList let:entry entries={displayUrls}>
		<a href={entry.href} target="_blank">
			{entry.label}
		</a>
	</MoreList>

	{#if showSuggestion}
		<h5>
			{__( 'What to do', 'jetpack-boost' )}
		</h5>

		<p class="suggestion">
			<TemplatedString template={suggestion( errorSet ).paragraph} vars={templateVars} />
			{#if suggestion( errorSet ).list}
				<NumberedList items={suggestion( errorSet ).list} vars={templateVars} />
			{/if}
		</p>
		{#if showClosingParagraph && suggestion( errorSet ).closingParagraph}
			<p class="suggestion-closing">
				<TemplatedString template={suggestion( errorSet ).closingParagraph} vars={templateVars} />
			</p>
		{/if}

		<svelte:component this={footerComponent( errorSet )} />
	{/if}

	{#if rawError( errorSet )}
		{#if foldRawErrors}
			<FoldingElement
				showLabel={__( 'See error message', 'jetpack-boost' )}
				hideLabel={__( 'Hide error message', 'jetpack-boost' )}
			>
				<p class="raw-error" transition:slide|local>
					{rawError( errorSet )}
				</p>
			</FoldingElement>
		{:else}
			<p class="raw-error" transition:slide|local>
				{rawError( errorSet )}
			</p>
		{/if}
	{/if}
</div>
