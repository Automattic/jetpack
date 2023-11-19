<script lang="ts">
	export let size = '1.4rem';
	export let lineWidth = '2px';
</script>

<div class="jb-spinner" style:--spinnerSize={size} style:--spinnerLineWidth={lineWidth} />

<style>
	.jb-spinner {
		width: var( --spinnerSize );
		height: var( --spinnerSize );
		border-radius: 50%;
		border: var( --spinnerLineWidth ) solid #000;
		border-top-color: transparent;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate( 360deg );
		}
	}
</style>
