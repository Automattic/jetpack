<script lang="ts">
	export let color: string;
</script>

<div class="jb-pill" style="--jb-pill-color: {color}">
	<span class="jb-pill__text"><slot /></span>
</div>
