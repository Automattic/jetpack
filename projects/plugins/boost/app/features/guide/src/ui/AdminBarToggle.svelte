<script lang="ts">
	import JetpackLogo from './JetpackLogo.svelte';
	import state from './StateStore';

	export let href: string;

	function toggleUI() {
		state.cycle();
	}
</script>

<a
	id="jetpack-boost-bar"
	{href}
	class="ab-item"
	class:inactive={$state === 'Inactive'}
	on:click|preventDefault={toggleUI}
>
	<JetpackLogo />
	<span>Image Guide: {$state}</span>
</a>

<style lang="scss">
	#jetpack-boost-bar.ab-item {
		display: flex; // Overriding #wpadminbar style
		gap: 10px;
		align-items: center;

		&.inactive :global(svg) {
			filter: grayscale(100%) contrast(1.7);
		}
	}
</style>
