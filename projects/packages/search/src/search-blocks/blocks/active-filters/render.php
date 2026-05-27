<?php
/**
 * Active Filters block render — shows currently selected filter pills.
 *
 * WordPress passes $attributes at runtime; VariableAnalysis can't see that.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-class--is-empty="!state.hasActiveFilters"
	data-wp-watch="callbacks.reconcilePills"
>
	<span class="jetpack-search-active-filters__heading">
		<?php esc_html_e( 'Active filters:', 'jetpack-search-pkg' ); ?>
	</span>
	<ul class="jetpack-search-active-filters__pills">
		<template
			data-wp-each--pill="state.activePills"
			data-wp-each-key="context.pill.id"
		>
			<li data-wp-bind--data-pill-id="context.pill.id">
				<button
					type="button"
					class="wp-element-button jetpack-search-active-filters__pill"
					data-wp-on--click="actions.onRemovePill"
					data-wp-bind--aria-label="context.pill.ariaLabel"
				>
					<span
						class="jetpack-search-active-filters__pill-label"
						data-wp-text="context.pill.label"
					></span>
					<span class="jetpack-search-active-filters__pill-remove" aria-hidden="true">×</span>
				</button>
			</li>
		</template>
	</ul>
</div>
