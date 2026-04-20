<?php
/**
 * Active Filters block render — shows currently selected filter pills.
 *
 * WordPress passes $attributes at runtime; VariableAnalysis can't see that.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.hasActiveFilters"
>
	<span><?php esc_html_e( 'Active filters:', 'jetpack-search-pkg' ); ?></span>
	<div
		class="jetpack-search-active-filters__pills"
		data-wp-each--pill="state.activePills"
		data-wp-each-key="context.pill.id"
	>
		<template data-wp-each-child>
			<button
				class="jetpack-search-active-filters__pill"
				data-wp-on--click="actions.onRemovePill"
				data-wp-text="context.pill.label"
			></button>
		</template>
	</div>
	<button
		class="jetpack-search-active-filters__clear-all"
		data-wp-on--click="actions.clearFilters"
	>
		<?php esc_html_e( 'Clear all', 'jetpack-search-pkg' ); ?>
	</button>
</div>
