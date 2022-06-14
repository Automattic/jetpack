<!--
	This component pops out and shows a message based on the props passed to it
    - title
    - message
    - call to action
    - CTA link
    - action 
    - nonce 
-->
<script>
	import { createEventDispatcher } from 'svelte';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import { makeAdminAjaxRequest } from '../../../utils/make-admin-ajax-request';
	import slideRightTransition from '../../../utils/slide-right-transition';

	export let title = '';
	export let message = '';
	export let ctaLink = '';
	export let cta = '';

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
		{title}
	</h3>
	<p class="jb-rating-card__paragraph">
		{message}
	</p>
	<a
		class="jb-button--primary"
		href={ctaLink}
		target="_blank"
		on:click={() => {
			disableRatingPrompt();
		}}
	>
		{cta}
	</a>
</div>
