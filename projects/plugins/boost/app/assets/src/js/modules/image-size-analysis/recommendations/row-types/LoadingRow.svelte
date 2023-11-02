<script lang="ts">
	import TableRow from './TableRow.svelte';
</script>

<TableRow enableTransition={false} expandable={false}>
	<svelte:fragment slot="main">
		<div class="jb-table-row__title">...</div>
	</svelte:fragment>
</TableRow>
