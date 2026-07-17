<?php
/**
 * Filter-checkbox block render.
 *
 * WordPress passes $attributes, $content, $block at runtime; VariableAnalysis
 * can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Phan flags `(array) $attributes` as an undeclared global even under a
// namespace; subscripted access (e.g. `$attributes['key']`) isn't flagged.
// WordPress always passes an array for the block's $attributes argument, so
// the suppressions are safe.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Checkbox::derive_filter_key( (array) $attributes );
// Short-circuit when the block has no valid filter key OR when the
// Interactivity API isn't available. Both wp_interactivity_state() (below)
// and wp_interactivity_data_wp_context() (in the template) were introduced
// in WP 6.5; calling either without the function would fatal.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Checkbox::build_config( (array) $attributes, $filter_key );

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests, ES filter clauses, and the
// active-filters pill list. wp_interactivity_state() deep-merges so each
// block adds its own key without clobbering others. Availability guarded
// by the early return at the top of the file.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

$view          = Search_Blocks::pre_hydration_filter_view( $filter_key );
$label         = $config['label'];
$display_style = Filter_Checkbox::normalize_display_style( $attributes['displayStyle'] ?? null );

// Skip `data-wp-interactive` when an ancestor already owns the
// `jetpack-search` interactive scope. Nesting two same-namespace interactive
// scopes is the SEARCH-266 trigger — the Interactivity runtime re-runs its
// `data-wp-each` pass against the inner scope and the first-rendered item's
// `data-wp-text` / `data-wp-bind--hidden` bindings end up frozen. Inheriting
// from the parent's scope keeps every directive resolving against a single
// store hydration. The `instanceof` check narrows `$block`'s type for static
// analysis — WP guarantees it's set to a `WP_Block` instance when render.php
// is included from `WP_Block::render()`.
$in_interactive_scope = isset( $block ) && $block instanceof \WP_Block
	&& ! empty( $block->context['jetpack-search/inInteractiveScope'] );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'data-display-style' => $display_style ) ) ); ?>
	<?php echo $in_interactive_scope ? '' : 'data-wp-interactive="jetpack-search"'; ?>
	<?php Search_Blocks::emit_filter_wrapper_context( $filter_key, $view['show_wrapper'] ); ?>
	data-wp-bind--hidden="context.wrapperHidden"
	data-wp-watch="callbacks.syncFilterWrapperVisibility"
	<?php echo $view['show_wrapper'] ? '' : 'hidden'; ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<?php require __DIR__ . '/../filter-skeleton-partial.php'; ?>
	<ul class="jetpack-search-filter__list">
		<template
			data-wp-each--item="state.filterItems"
			data-wp-each-key="context.item.value"
		>
			<li
				class="jetpack-search-filter__item"
			>
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
