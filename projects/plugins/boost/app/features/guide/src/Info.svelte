<script lang="ts">
	import type { ComparedImage } from './Measurements';
	export let image: ComparedImage;

	const imageName = image.url.split('/').pop();
	const ratio = image.scaling.pixels.toFixed(2);
	const fakeSavingsInKB = Math.round(1024 / image.scaling.pixels).toFixed(2);
	const severity =
		image.scaling.pixels > 4 ? 'high' : image.scaling.pixels > 2 ? 'medium' : 'normal';
</script>

<div class="jb-guide">
	<div class="jb-guide-previews">
		<div class="jb-guide-preview {severity}">
			<div class="jb-guide-preview__ratio">{ratio}</div>
		</div>
	</div>
	<div class="jb-guide-overlay">
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

	{@html image.node.outerHTML}
</div>
