<!--
	This component shows a prompt to rate Boost if scores improved after enabling a feature.
-->
<script>
	import { createEventDispatcher } from 'svelte';
	import { __, sprintf } from '@wordpress/i18n';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import { makeAdminAjaxRequest } from '../../../utils/make-admin-ajax-request';
	import slideRightTransition from '../../../utils/slide-right-transition';

	export let improvement;
	export let currentPercentage;

	const dispatch = createEventDispatcher();
	async function disableRatingPrompt() {
		// Send a request to back-end to permanently disable the rating prompt.
		await makeAdminAjaxRequest( {
			action: 'set_show_rating_prompt',
			value: false,
			// eslint-disable-next-line camelcase
			nonce: Jetpack_Boost.showRatingPromptNonce,
		} );

		// Close the currently open prompt.
		dispatch( 'dismiss' );
	}
</script>

<div class="jb-rating-card" transition:slideRightTransition>
	<CloseButton on:click={() => dispatch( 'dismiss' )} />
	<h3 class="jb-rating-card__headline">
		{#if improvement > 5}
			{sprintf(
				/* translators: %d is the speed score improvement percentage */
				__( 'Faster by %1$d%%', 'jetpack-boost' ),
				improvement
			)}
		{:else}
			{sprintf(
				/* translators: %d is the speed score number */
				__( 'You achieved a score of %d!', 'jetpack-boost' ),
				currentPercentage
			)}
		{/if}
	</h3>
	<p class="jb-rating-card__paragraph">
		{__(
			'That’s a great result! If you’re happy with your result, why not rate Boost?',
			'jetpack-boost'
		)}
	</p>
	<a
		class="jb-button--primary"
		href="https://wordpress.org/support/plugin/jetpack-boost/reviews/#new-post"
		target="_blank"
		on:click={() => {
			disableRatingPrompt();
		}}
	>
		{__( 'Rate the plugin', 'jetpack-boost' )}
	</a>
</div>
