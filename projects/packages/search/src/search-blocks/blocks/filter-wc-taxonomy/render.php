<?php
/**
 * Search product filter — WooCommerce product taxonomy render.
 *
 * Renders one block instance per chosen product taxonomy (`product_cat`,
 * `product_tag`, `product_brand`). DOM and Interactivity bindings mirror
 * filter-checkbox — same `state.filterItems` / `actions.onFilterChange`
 * getters drive every checkbox-shaped product filter block.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Wc_Taxonomy::derive_filter_key( (array) $attributes );
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Wc_Taxonomy::build_config( (array) $attributes, $filter_key );

wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

$view  = Search_Blocks::pre_hydration_filter_view( $filter_key );
$label = (string) $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-taxonomy' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php Search_Blocks::emit_filter_wrapper_context( $filter_key, $view['show_wrapper'] ); ?>
	data-wp-bind--hidden="context.wrapperHidden"
	data-wp-watch="callbacks.syncFilterWrapperVisibility"
	<?php echo $view['show_wrapper'] ? '' : 'hidden'; ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul class="jetpack-search-filter__list">
		<template
			data-wp-each--item="state.filterItems"
			data-wp-each-key="context.item.value"
		>
			<li class="jetpack-search-filter__item">
				<label>
					<input
						type="checkbox"
						data-wp-bind--value="context.item.value"
						data-wp-bind--checked="context.item.checked"
						data-wp-on--change="actions.onFilterChange"
					/>
					<span
						class="jetpack-search-filter__label"
						data-wp-text="context.item.label"
					></span>
					<span
						class="jetpack-search-filter__count"
						data-wp-bind--hidden="!context.item.showCount"
						data-wp-text="context.item.countLabel"
					></span>
				</label>
			</li>
		</template>
	</ul>
</div>
