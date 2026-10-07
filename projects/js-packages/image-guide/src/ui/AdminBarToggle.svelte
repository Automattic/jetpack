<script lang="ts">
	import './style.scss';
	import ImageGuideAnalytics, { type TracksCallback } from '../analytics';
	import { guideLabel, guideState } from '../stores/GuideState';
	import JetpackLogo from './JetpackLogo.svelte';

	export let href: string;
	export let tracksCallback: TracksCallback;

	$: ImageGuideAnalytics.setTracksCallback( tracksCallback );

	function toggleUI() {
		guideState.cycle();
		ImageGuideAnalytics.trackUIStateChange();
	}
</script>

<a
	id="jetpack-boost-guide-bar"
	{href}
	class="jb-ig-toggle ab-item {$guideState}"
	on:click|preventDefault={toggleUI}
>
	<JetpackLogo />
	<span>Image Guide: {$guideLabel}</span>
</a>
