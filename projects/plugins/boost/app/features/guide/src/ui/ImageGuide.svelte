<script lang="ts">
	import type { ComparedImage } from '../Measurements';
	export let image: ComparedImage;
	const imageName = image.url.split('/').pop();
	const ratio = image.scaling.pixels.toFixed(2);
	const fakeSavingsInKB = Math.round(1024 / image.scaling.pixels).toFixed(2);
</script>

<div class="info">
	<div class="details">
		<a href={image.url} target="_blank">{imageName}</a> is <b>{ratio}x</b> larger the needed.
		<br />
		Actual Size: {image.onScreen.width} x {image.onScreen.height} <br />
		Loaded Size: {image.width} x {image.height} <br />
		Potential Savings: <strong>{fakeSavingsInKB} KB</strong>
	</div>
</div>

<style lang="scss">
	:global(.jetpack-boost-guide.relative) {
		position: relative;
	}

	.info {
		color: black;
		padding: 25px;
		font-family: sans-serif;
		background-color: rgb(255, 255, 255);
		margin-bottom: 10px;

		width: fit-content;
		border-radius: 6px;
		font-size: 15px;
		display: flex;
		gap: 15px;
	}

	.overlay::after {
		background: url(../boost.png) no-repeat;
		content: '';
		position: absolute;
		bottom: 20px;
		right: 20px;
		display: block;
		width: 100px;
		height: 100px;
		z-index: 9001;
		background-position: center;
		background-size: 70px;
		overflow: hidden;
		height: 40px;
		border-radius: 6px;
		width: 100px;
		background-color: white;
	}
</style>
