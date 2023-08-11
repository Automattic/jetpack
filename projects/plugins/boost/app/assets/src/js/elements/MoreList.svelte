<!--
	This Component shows a <ul> list with one copy of <slot> per entry in
	entries. Each slot receives an "entry" prop with its entry details.

	Automatically folds away with "...and x more" when the list exceeds showLimit.
-->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import { sprintf, __ } from '@wordpress/i18n';

	/**
	 * Svelte doesn't support TypeScript generics,
	 * so this is a workaround found in:
	 * https://github.com/sveltejs/language-tools/issues/273
	 */
	type T = $$Generic;
	interface $$Slots {
		default: {
			entry: T;
		};
	}

	export let entries: T[] = [];

	/**
	 * The maximum number of items to show before folding extras away.
	 */
	export let showLimit = 2;

	let expanded = false;
	function toggle() {
		expanded = ! expanded;
	}

	$: listItems = expanded ? entries : entries.slice( 0, showLimit );
</script>

<ul>
	{#each listItems as item}
		<li transition:slide|local>
			<slot entry={item} />
		</li>
	{/each}

	{#if ! expanded && entries.length > showLimit}
		<a on:click|preventDefault={toggle} transition:slide|local href={'#'}>
			{sprintf(
				/* translators: %d is the number of items in this list hidden behind this link */
				__( '…and %d more', 'jetpack-boost' ),
				entries.length - showLimit
			)}
		</a>
	{/if}
</ul>
