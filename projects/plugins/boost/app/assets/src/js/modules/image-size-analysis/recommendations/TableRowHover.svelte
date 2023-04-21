<script lang="ts">
	import Button from '../../../elements/Button.svelte';
</script>

<div class="hover">
	<p>Resize this image to match the size of the screen dimensions.</p>

	<div class="button-container">
		<Button small fill>Edit Page</Button>
	</div>
</div>

<style lang="scss">
	.hover {
		display: flex;
		align-items: center;
		gap: var( --gap );
	}
	p {
		flex-grow: 1;
		max-width: 220px;
	}
</style>
