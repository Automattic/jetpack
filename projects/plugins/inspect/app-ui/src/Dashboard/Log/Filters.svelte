<script lang="ts">
	export let filter: string;
</script>

<input
	placeholder="for example: http://jetpack*"
	type="text"
	bind:value={filter}
/>
<style>
	input {
		flex: 1;
	}
</style>
