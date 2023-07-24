<script lang="ts">
	export let color: string;
</script>

<div class="pill" style:--jb-pill-color={color}>
	<span><slot /></span>
</div>

<style lang="scss">
	.pill {
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		background-color: var( --jb-pill-color );
		font-size: 0.8em;
	}
	// An inner to filter only the text color
	span {
		color: var( --jb-pill-color );
		filter: brightness( 0.3 ) saturate( 10 );
		font-weight: 500;
		white-space: nowrap;
	}
</style>
