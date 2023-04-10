<script lang="ts">
	import PencilIcon from '../../../svg/pencil.svg';

	export let summary: string;
	export let buttonText: string;
</script>

<div class="jb-critical-css__meta">
	<div class="summary">
		<div class="successes">
			{summary}
		</div>
	</div>

	<button type="button" class="components-button is-link">
		<PencilIcon />
		{buttonText}
	</button>
</div>
