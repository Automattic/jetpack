<script lang="ts">
	import { imageStore } from '../ApiMock';
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );
</script>

<div class="jb-hero">
	<span>Latest report as of {formatter.format( $imageStore.data.last_updated )}</span>
	<h1>{$imageStore.data.images.length} Image Recommendations</h1>
</div>

<style lang="scss">
	.jb-hero {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
