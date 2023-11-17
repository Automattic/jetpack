<script lang="ts">
	export let small = false;
	export let fill = false;
	export let width: string | null = null;
	export let href = '';
	export let disabled = false;
</script>

{#if href}
	<a {href} class="button" class:small class:fill style:width>
		<slot />
	</a>
{:else}
	<button class="button" {disabled} class:small class:fill on:click style:width>
		<slot />
	</button>
{/if}

<style lang="scss">
	// Increasing specificity
	// to override the default WordPress button styles.
	:global( #jb-dashboard ) {
		.button {
			display: inline-flex;
			justify-content: center;
			align-items: center;
			padding: 0 24px;

			background: #ffffff;

			color: #000;
			border: 1px solid currentColor;
			border-radius: 4px;

			font-weight: 600;
			font-size: 1rem;
			letter-spacing: -0.01em;
		}
		.small {
			padding: 4px 10px;
			line-height: 1.1;
			width: auto;
			height: auto;
			font-size: 0.875rem;
			border-radius: 6px;
		}
		.fill {
			color: #ffffff;
			background: #000;
		}
	}
</style>
