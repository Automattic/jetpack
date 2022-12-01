<script lang="ts">
	import JetpackLogo from './JetpackLogo.svelte';
	import { guideState, guideLabel } from '../stores/GuideState';

	export let href: string;

	function toggleUI() {
		guideState.cycle();
	}
</script>

<a
	id="jetpack-boost-guide-bar"
	{href}
	class="ab-item {$guideState}"
	on:click|preventDefault={toggleUI}
>
	<JetpackLogo />
	<span>Image Guide: {$guideLabel}</span>
</a>

<style lang="scss">
	#jetpack-boost-guide-bar.ab-item {
		display: flex; // Overriding #wpadminbar style
		gap: 10px;
		align-items: center;

		&.paused :global( svg ) {
			filter: grayscale( 100% ) contrast( 1.7 );
		}
	}
</style>
