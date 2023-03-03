<script lang="ts">
	import CloseButton from './CloseButton.svelte';

	export let title = '';
	let isOpened = false;

	function toggleTooltip() {
		isOpened = ! isOpened;
	}

	function closeTooltip() {
		isOpened = false;
	}
</script>

<div class="jb-tooltip{isOpened ? ' show-tooltip' : ''}">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<span class="jb-tooltip__info-icon" on:click={toggleTooltip}>i</span>
	<div class="jb-tooltip__info-container">
		<CloseButton on:click={closeTooltip} />
		{#if title}
			<div class="jp-tooltip__info-title">
				{title}
			</div>
		{/if}
		<slot />
		<i />
	</div>
</div>

<style lang="scss">
	@use '../../css/main/mixins.scss' as *;
	@use '../../css/main/variables.scss' as *;

	.jb-tooltip {
		display: inline-block;
		position: relative;
		color: $primary-black;
		font-size: 16px;
		line-height: 24px;

		&__info-icon {
			display: block;
			width: 18px;
			height: 18px;
			font-size: 13px;
			text-align: center;
			border-radius: 50%;
			vertical-align: middle;
			border: 2px solid $gray_30;
			cursor: pointer;
			line-height: 1.1em;
			font-weight: 700;
			color: $gray_30;
			margin: 0 8px;
		}

		&__info-container {
			display: none;
			min-width: 480px;
			top: 30px;
			left: 100px;
			transform: translate( -50%, 0 );
			padding: 24px;
			background-color: $primary-white;
			font-weight: normal;
			border-radius: $border-radius;
			position: absolute;
			z-index: 1000;
			text-align: left;

			@include box-shadow();

			@include breakpoint( xs ) {
				left: -60px;
			}

			@include breakpoint( sm ) {
				left: 0;
			}

			@include breakpoint( md ) {
				left: 100px;
			}

			i {
				position: absolute;
				bottom: 100%;
				left: 144px;
				width: 24px;
				height: 12px;
				overflow: hidden;
				text-align: center;

				@include breakpoint( xs ) {
					left: 305px;
				}

				@include breakpoint( sm ) {
					left: 245px;
				}

				@include breakpoint( md ) {
					left: 145px;
				}

				&::after {
					content: '';
					position: absolute;
					width: 12px;
					height: 12px;
					transform: translate( -50%, 50% ) rotate( 45deg );
					background-color: $primary-white;

					@include box-shadow();
				}
			}

			.jp-tooltip__info-title {
				font-weight: 600;
				font-size: 20px;
				line-height: 1.3;

				&:not( :last-child ) {
					margin-bottom: 20px;
				}
			}
		}

		&.show-tooltip {
			.jb-tooltip__info-container {
				display: block;
			}
		}

		:global( .cross-close ) {
			top: 26px;
			right: 26px;
			width: 24px;
			height: 24px;

			&:before,
			&:after {
				height: 14px;
				left: 11px;
				top: 5px;
				background-color: $primary-black;
			}
		}
	}
</style>
