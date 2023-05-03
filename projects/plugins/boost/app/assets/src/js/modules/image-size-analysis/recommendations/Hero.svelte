<script lang="ts">
	import { imageData } from '../datasync-image-size-analysis';
	import { imageDataActiveGroup } from '../store/derived-groups';
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );
</script>

<div class="jb-hero">
	<span>Latest report as of {formatter.format( $imageData.data.last_updated )}</span>
	<h1>{$imageDataActiveGroup.issues} Image Recommendations</h1>
</div>

<style lang="scss">
	.jb-hero {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
