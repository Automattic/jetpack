<script lang="ts">
	import { __ } from '@wordpress/i18n';
</script>

<a href={'#'} on:click|preventDefault class="cross-close">
	<span class="screen-reader-text">
		{__( 'Dismiss', 'jetpack-boost' )}
	</span>
</a>
