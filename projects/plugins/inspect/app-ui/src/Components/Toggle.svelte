<script lang="ts">
	export let id: string;
	export let checked = false;
	export let disabled = false;
</script>

<label class="switch" class:is-checked={checked}>
	<input {id} class="input" type="checkbox" {disabled} on:click bind:checked />
	<span class="track" />
</label>

<style lang="scss">
	@use 'sass:math';
	$width: 50px;
	$height: 25px;
	$border-radius: math.div($width, 2);

	$switch_width: 15px;
	$switch_height: $switch_width;
	$switch_border-radius: math.div($switch_width, 2);
	$switch_margin: 5px;
	$switch_movement: $width - $switch_width - $switch_margin * 2 - math.div($switch_margin, 2);

	.switch {
		position: relative;
		display: inline-block;
		width: $width;
		height: $height;
	}

	.switch input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.switch .track {
		position: absolute;
		width: 100%;
		height: 100%;
		cursor: pointer;
		background: transparent;
		border: 2px solid var(--jetpack_green_100);
		border-radius: $border-radius;
		transition: background-color 0.1s ease;
	}

	.switch .track:before {
		position: absolute;
		content: "";
		width: $switch_width;
		height: $switch_height;
		background: var(--jetpack_green_100);
		border-radius: 50%;
		left: $switch_margin;
		right: auto;
		top: 0;
		bottom: 0;
		margin-top: auto;
		margin-bottom: auto;
		transition: transform 0.3s ease, background-color 0.1s ease;
	}

	.switch input:checked {
		+ .track {
			background: var(--jetpack-green);
			border-color: var(--jetpack-green);

			&:before {
				transform: translateX($switch_movement);
				background-color: var(--jetpack_green_0);
			}
		}
	}
</style>
