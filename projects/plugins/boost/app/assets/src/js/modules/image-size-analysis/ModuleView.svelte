<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ProgressBar from '../../elements/ProgressBar.svelte';
</script>

<ProgressBar progress={50}>
	{__( 'Give us a few minutes while we go through all your content.', 'jetpack-boost' )}
</ProgressBar>
<div class="jb-spacer" />
<Button>See report in progress</Button>

<style lang="scss">
	.jb-spacer {
		height: 3.5rem;
	}
</style>
