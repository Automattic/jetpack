<script lang="ts">
	import type { ComparedImage } from './Measurements';
	export let image: ComparedImage;
	const imageName = image.url.split('/').pop();
	const ratio = image.scaling.pixels.toFixed(2);
	const fakeSavingsInKB = Math.round(1024 / image.scaling.pixels).toFixed(2);
</script>




<div class="jb-guide-overlay" >
	<div class="jb-guide-info">
		<div class="jb-guide-details">
			<a href={image.url} target="_blank">{imageName}</a> is <b>{ratio}x</b> larger the needed.
			<br />
			Actual Size: {image.onScreen.width} x {image.onScreen.height} <br />
			Loaded Size: {image.width} x {image.height} <br />
			Potential Savings: <strong>{fakeSavingsInKB} KB</strong>
		</div>
	</div>
</div>


<style lang="scss">
	.jb-guide-info {
		color: black;
	}
</style>
