<script lang="ts">
	/**
	 * The progress bar component.
	 *
	 * @param {number} progress - The progress percentage between 0 - 100.
	 */
	export let progress: number;
</script>

<div class="jb-label">
	<slot />
</div>
<div
	role="progressbar"
	aria-valuemax={100}
	aria-valuemin={0}
	aria-valuenow={progress}
	class="jb-progress-bar"
>
	<div class="jb-progress-filler" aria-hidden="true" style={`width: ${ progress }%;`} />
</div>

<style lang="scss">
	.jb-label {
		color: var( --jetpack-green-50 );
		margin-bottom: 1em;
		display: block;
		font-size: 14px;
		line-height: 20px;
	}

	// Basic Progress Bar styling.
	.jb-progress-bar {
		height: 20px;
		border-radius: 50px;
		background-color: #f1f1f1;
	}

	.jb-progress-filler {
		height: 100%;
		width: 0%;
		will-change: width;
		transition: width 700ms ease-in-out;
		border-radius: 50px;
		background-color: #069e08;
	}
</style>
