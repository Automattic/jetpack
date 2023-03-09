<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ProgressActivityLabel from '../../elements/ProgressActivityLabel.svelte';
	import ProgressBar from '../../elements/ProgressBar.svelte';
	import MultiProgress from './MultiProgress.svelte';
</script>

<ProgressActivityLabel>
	{__( 'Give us a few minutes while we go through all your content.', 'jetpack-boost' )}
</ProgressActivityLabel>

<ProgressBar progress={50} />
<div class="jb-spacer" />

<MultiProgress />

<div class="jb-spacer" />
<Button>See report in progress</Button>

<style lang="scss">
	.jb-spacer {
		height: 3.5rem;
	}
</style>
