<!--
	This Component shows a <ul> list with one copy of <slot> per entry in
	entries. Each slot receives an "entry" prop with its entry details.

	Automatically folds away with "...and x more" when the list exceeds showLimit.
-->
<script>
	import { sprintf, __ } from '@wordpress/i18n';
	import { slide } from 'svelte/transition';

	/**
	 * @var {array} entries List of objects to pass to each copy of the slot.
	 */
	export let entries = [];

	/**
	 * @var {number} showLimit The maximum number of items to show before folding extras away.
	 */
	export let showLimit = 2;

	let expanded = false;

	function toggle() {
		expanded = ! expanded;
	}
</script>

<ul>
	{#each expanded ? entries : entries.slice( 0, showLimit ) as props}
		<li transition:slide|local>
			<slot entry={props} />
		</li>
	{/each}

	{#if ! expanded && entries.length > showLimit}
		<a on:click|preventDefault={toggle} transition:slide|local href={'#'}>
			{sprintf(
				/* translators: %d is the number of items in this list hidden behind this link */
				__( '...and %d more', 'jetpack-boost' ),
				entries.length - showLimit
			)}
		</a>
	{/if}
</ul>
