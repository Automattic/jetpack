<script lang="ts">
	import { __ } from '@wordpress/i18n';
	import TableRow from './TableRow.svelte';
</script>

<TableRow enableTransition={false} expandable={false}>
	<svelte:fragment slot="main">
		<div class="jb-table-row__title">
			{__( 'An error occurred while loading this entry.', 'jetpack-boost' )}
		</div>
	</svelte:fragment>
</TableRow>

<style lang="scss">
	.jb-table-row__title {
		grid-column: title;
	}
</style>
