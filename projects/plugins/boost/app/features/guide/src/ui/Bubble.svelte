<script lang="ts">
	export let ratio: number;
	const severity = ratio > 4 ? 'high' : ratio > 2 ? 'medium' : 'normal';
</script>

<div class="preview {severity}" on:mouseenter>
	<div class="bubble">{ratio.toFixed(2)}</div>
</div>

<style lang="scss">
	.preview {
		background-color: #069e08;
		color: white;

		font-weight: 700;
		font-family: sans-serif;
		font-size: 11px;

		padding: 3px;
		width: 32px;
		height: 32px;
		border-radius: 50%;

		display: flex;
		justify-content: center;
		align-items: center;

		text-shadow: 0 0 1px rgba(0, 0, 0, 0.25);
		cursor: default;

		&.high {
			background-color: #e52e00;
		}

		&.medium {
			background-color: #e98800;
		}
	}
</style>
