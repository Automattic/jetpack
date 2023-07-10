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
	<div class="jb-table-row recommendation-page-grid" on:click={toggleExpand}>
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
		<div class="table-row-expanded">
			<slot name="expanded" />
		</div>
	{/if}
</div>

<style lang="scss">
	.jb-table-row-container {
		background-color: #fff;
		border-top: var( --border );
		border-left: var( --border );
		border-right: var( --border );
		margin: 0;
		transition: margin 100ms ease;

		// This is a workaround for box shadows.
		// If the shadow was applied to the row directly
		// it would cast a shadow on other rows
		// This puts the shadow on a pseudo element
		// and moves it behind the row
		// The downside of this approach is that I can't use
		// overflow: hidden to clip border radius here.
		position: relative;
		&:before {
			content: '';
			position: absolute;
			box-shadow: 0px 4px 24px 0px hsla( 0, 0%, 0%, 0.08 );
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: -1;
		}

		&:last-child {
			border-bottom-right-radius: var( --border-radius );
			border-bottom-left-radius: var( --border-radius );
			border-bottom: var( --border );
		}
	}

	.expanded {
		margin-bottom: var( --expanded-gap );
		border-bottom-right-radius: var( --border-radius );
		border-bottom-left-radius: var( --border-radius );
		border-bottom: var( --border );
	}

	// Expanded view, but not the one at the very top.
	:global( :not( .jb-table-header ) + .jb-table-row-container.expanded ) {
		margin-top: var( --expanded-gap );
		border-top-right-radius: var( --border-radius );
		border-top-left-radius: var( --border-radius );
	}

	// The row after the expanded view.
	:global( .expanded + .jb-table-row-container ) {
		border-top-right-radius: var( --border-radius );
		border-top-left-radius: var( --border-radius );
	}

	// The row before the expanded view.
	:global( .jb-table-row-container:has( + .expanded ) ) {
		border-bottom-right-radius: var( --border-radius );
		border-bottom-left-radius: var( --border-radius );
		border-bottom: var( --border );
	}

	:global .jb-table-row {
		min-height: 115px;
		cursor: pointer;

		:global( .jb-table-row__hover-content ) {
			display: none;
		}

		&:hover {
			background-color: #f6f7f7;

			// Can't use overflow because of the box-shadow workaround above.
			// So instead, repeating the border radius.
			.expanded & {
				border-top-right-radius: var( --border-radius );
				border-top-left-radius: var( --border-radius );
			}
			.jb-table-row__hover-content {
				display: block;
			}
			.jb-table-row__device,
			.jb-table-row__page {
				display: none;
			}
		}
	}

	.jb-table-row__expand {
		cursor: pointer;
		text-align: center;
		grid-column: expand;
		.expanded & {
			svg {
				transform: rotate( 180deg );
			}
		}
	}

	.table-row-expanded {
		display: flex;
		justify-content: space-between;
		padding: var( --gap );
		padding-left: calc( var( --thumbnail-size ) + var( --gap ) * 2 );
	}
</style>
