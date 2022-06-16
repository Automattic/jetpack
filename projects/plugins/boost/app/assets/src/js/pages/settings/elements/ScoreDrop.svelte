<!--
	This component shows a prompt to refresh the Page Speed scores or contact support if a score has persistently dropped.
-->
<script>
	/**
	 * WordPress dependencies
	 */
	import { createEventDispatcher } from 'svelte';
	import { __ } from '@wordpress/i18n';
	/**
	 * Internal dependencies
	 */
	import CloseButton from '../../../elements/CloseButton.svelte';
	import { makeAdminAjaxRequest } from '../../../utils/make-admin-ajax-request';
	import slideRightTransition from '../../../utils/slide-right-transition';

	const dispatch = createEventDispatcher();

	async function disableScorePrompt() {
		// Send a request to back-end to permanently disable the rating prompt.
		await makeAdminAjaxRequest( {
			action: 'set_show_score_prompt',
			value: false,
			// eslint-disable-next-line camelcase
			nonce: Jetpack_Boost.showScorePromptNonce,
		} );

		// Close the currently open prompt.
		dispatch( 'dismiss' );
	}
</script>

<div class="jb-rating-card" transition:slideRightTransition>
	<CloseButton on:click={() => dispatch( 'dismiss' )} />
	<h3 class="jb-rating-card__headline">
		{__( 'Your site score dropped', 'jetpack-boost' )}
	</h3>
	<p class="jb-rating-card__paragraph">
		{__(
			'Jetpack Boost should not slow your site down. Try refreshing your score. If the problem persists please contact support',
			'jetpack-boost'
		)}
	</p>
	<a
		class="jb-button--primary"
		href="https://wordpress.org/support/plugin/jetpack-boost/#new-topic-0"
		target="_blank"
		on:click={() => {
			disableScorePrompt();
		}}
	>
		{__( 'Contact Support', 'jetpack-boost' )}
	</a>
</div>
