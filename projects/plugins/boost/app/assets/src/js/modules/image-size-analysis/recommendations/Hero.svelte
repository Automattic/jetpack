<script lang="ts">
	import { isaData } from '../store/isa-data';
	import { imageDataActiveGroup } from '../store/isa-groups';
	const formatter = new Intl.DateTimeFormat( 'en-US', {
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true,
	} );
</script>

<div class="jb-hero">
	<span>Latest report as of {formatter.format( $isaData.data.last_updated )}</span>
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
