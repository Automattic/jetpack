<script lang="ts">
	export let ratio: number;
	const severity = ratio > 4 ? 'high' : ratio > 2 ? 'medium' : 'normal';
</script>

<div class="jb-guide-preview {severity}" on:mouseenter>
	<div class="jb-guide-preview__ratio">{ratio.toFixed(2)}</div>
</div>
