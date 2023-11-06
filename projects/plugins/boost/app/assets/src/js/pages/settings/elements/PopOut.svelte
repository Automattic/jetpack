<!--
	This component pops out and shows a message based on the props passed to it
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { __ } from '@wordpress/i18n/';
	import CloseButton from '../../../elements/CloseButton.svelte';
	import TemplatedString from '../../../elements/TemplatedString.svelte';
	import slideRightTransition from '../../../utils/slide-right-transition';

	export let title = '';
	export let message = {
		text: '',
		vars: {},
	};
	export let ctaLink = '';
	export let cta = '';

	const dispatch = createEventDispatcher();
</script>

<div class="jb-rating-card__wrapper">
	<div class="jb-rating-card" transition:slideRightTransition>
		<CloseButton on:click={() => dispatch( 'dismiss' )} />
		<h3 class="jb-rating-card__headline">
			{title}
		</h3>
		<p class="jb-rating-card__paragraph">
			<TemplatedString template={message.text} vars={message.vars} />
		</p>
		<a
			class="jb-button--primary"
			href={ctaLink}
			target="_blank"
			rel="noreferrer"
			on:click={() => dispatch( 'disable-modal' )}
		>
			{cta}
		</a>

		<a
			class="jb-link"
			href={ctaLink}
			target="_blank"
			rel="noreferrer"
			on:click|preventDefault={() => dispatch( 'disable-modal' )}
		>
			{__( 'Do not show me again', 'jetpack-boost' )}
		</a>
	</div>
</div>

<style>
	.jb-link {
		float: right;
	}
</style>
