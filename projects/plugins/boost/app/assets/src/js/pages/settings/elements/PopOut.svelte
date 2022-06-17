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
	import { __ } from '@wordpress/i18n/';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import { makeAdminAjaxRequest } from '../../../utils/make-admin-ajax-request';
	import slideRightTransition from '../../../utils/slide-right-transition';

	export let id = '';
	export let title = '';
	export let message = '';
	export let ctaLink = '';
	export let cta = '';
	export let dismissedPrompts = [];

	let data = '';

	const dispatch = createEventDispatcher();

	//need to set this as a writable so it is updated by the app. Page refresh sorts it but if I hit refresh score
	//it will show it again even if the wp_option has been set on the back end. Writable store should solve this
	//then the work is complete - some tidy up of the codebase will be neded since we do not need score increase
	//or score decrease.

	async function disablePrompt() {
		// Send a request to back-end to permanently disable the rating prompt.
		data = {
			action: 'set_show_score_prompt',
			id,
			value: false,
			// eslint-disable-next-line camelcase
			nonce: Jetpack_Boost.showScorePromptNonce,
		};

		await makeAdminAjaxRequest( data );

		dismissedPrompts = [ ...dismissedPrompts, id ];
		dispatch( 'dismiss' );
	}
</script>

{#if ! dismissedPrompts.includes( id )}
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
				disablePrompt();
			}}
		>
			{cta}
		</a>

		<a
			class="jb-link"
			href={ctaLink}
			target="_blank"
			on:click|preventDefault={() => {
				disablePrompt();
			}}
		>
			{__( 'Do not show me again', 'jetpack-boost' )}
		</a>
	</div>
{/if}
