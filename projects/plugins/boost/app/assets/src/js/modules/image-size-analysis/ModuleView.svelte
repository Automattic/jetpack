<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import ProgressBar from '../../elements/ProgressBar.svelte';
</script>

<ProgressBar progress={50}>
	{__( 'Give us a few minutes while we go through all your content.', 'jetpack-boost' )}
</ProgressBar>
