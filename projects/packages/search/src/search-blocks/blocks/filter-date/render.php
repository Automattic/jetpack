<?php
/**
 * Filter-date block render.
 *
 * WordPress passes $attributes, $content, $block at runtime — VariableAnalysis
 * can't see those, so the sniff is disabled below.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Date::derive_filter_key( (array) $attributes );
// wp_interactivity_state / wp_interactivity_data_wp_context need WP 6.5+.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Date::build_config( (array) $attributes, $filter_key );

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
$display_style = Search_Blocks::normalize_display_style( $attributes['displayStyle'] ?? null );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'data-display-style' => $display_style ) ) ); ?>
	data-wp-interactive="jetpack-search"
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
