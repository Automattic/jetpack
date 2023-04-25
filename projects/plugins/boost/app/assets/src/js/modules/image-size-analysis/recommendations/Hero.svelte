<script lang="ts">
	import { imageStore } from '../ApiMock';
</script>

<div class="jb-hero">
	<span>Latest report as of March 17th at 3:27 PM</span>
	<h1>{$imageStore.length} Image Recommendations</h1>
</div>

<style lang="scss">
	.jb-hero {
		padding: 50px 0;
		display: flex;
		flex-direction: column;
		gap: calc( var( --gap ) / 2 );
	}
</style>
