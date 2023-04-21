<script lang="ts">
	import { ImageMeta } from '../ApiMock';

	export let data: ImageMeta;

	const dimensions = `${ data.image.dimensions.file.width } x ${ data.image.dimensions.file.height }`;
	const sizeOnScreen = `${ data.image.dimensions.size_on_screen.width } x ${ data.image.dimensions.size_on_screen.height }`;
	const expectedDimensions = `${ data.image.dimensions.expected.width } x ${ data.image.dimensions.expected.height }`;
</script>

<div class="table-row-expanded">
	<div class="image-details">
		<h4>Image Details</h4>
		<p>File dimensions: {dimensions} px</p>
		<p>Expected dimensions: {expectedDimensions} px</p>
		<p>Size on screen: {sizeOnScreen} px</p>
	</div>

	<div class="fix-options">
		<h4>How to fix</h4>
		<p>{data.instructions}</p>
		<button>Fix on page</button>
		<button class="ignore-btn">Ignore</button>
	</div>
</div>

<style lang="scss">
	.table-row-expanded {
		display: flex;
		justify-content: space-between;
		padding: 1rem;
	}

	.image-details {
		flex: 1;
		border-right: 1px solid #ddd;
		padding-right: 1rem;
	}

	.fix-options {
		flex: 1;
		text-align: right;
		padding-left: 1rem;
	}

	button {
		background-color: #4caf50;
		border: none;
		color: white;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 14px;

		margin: 4px 2px;
		cursor: pointer;
		border-radius: 4px;
		padding: 8px 16px;
	}

	.ignore-btn {
		background-color: #f44336;
	}
</style>
