<script lang="ts">
	import { quadOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	export let expandable: boolean;
	export let enableTransition: boolean;

	let expanded = false;
	function toggleExpand( e ) {
		if ( ! expandable ) {
			return;
		}

		// Don't expand if the user clicked a link or a button.
		if ( e.target.tagName === 'A' || e.target.tagName === 'BUTTON' ) {
			return;
		}
		expanded = ! expanded;
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="jb-table-row-container"
	out:slide={{ duration: enableTransition ? 250 : 0, easing: quadOut }}
	class:expanded
>
	<div class="jb-table-row jb-recommendation-page-grid" on:click={toggleExpand}>
		<slot name="main" />

		{#if expandable}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="jb-table-row__expand">
				<svg
					width="16"
					height="10"
					viewBox="0 0 16 10"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.667349 1.33325L8.00068 7.99992L15.334 1.33325"
						stroke="#1E1E1E"
						stroke-width="1.5"
					/>
				</svg>
			</div>
		{/if}
	</div>

	{#if expanded && expandable}
		<div class="jb-table-row__expanded">
			<slot name="expanded" />
		</div>
	{/if}
</div>
