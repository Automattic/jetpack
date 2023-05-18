<script lang="ts">
	import Button from '../../../elements/Button.svelte';
	import type { ISA_Data } from '../store/isa-data';
	export let data: ISA_Data;
</script>

<div class="hover">
	<p>Resize this image to match the size of the screen dimensions.</p>

	<div class="button-container">
		<Button small fill href={data.edit_url}>Edit Page</Button>
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
	}
</style>
