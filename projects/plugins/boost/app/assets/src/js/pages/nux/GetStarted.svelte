<script>
	import { __ } from '@wordpress/i18n';
	import ProgressBar from '../settings/elements/ProgressBar.svelte';
</script>

<div id="jb-start" class="jb-settings">
	<div class="jb-container jb-container--fixed">
		<h1 class="my-2 heading center no-outline">
			{__( 'Generating Critical CSS', 'jetpack-boost' )}
		</h1>
		<p class="jb-card__summary my-2">
			{__(
				'Critical CSS is the most important styles of your website loaded first to speed up page performance.',
				'jetpack-boost'
			)}
		</p>

		<ProgressBar progress={25} />
	</div>
</div>
