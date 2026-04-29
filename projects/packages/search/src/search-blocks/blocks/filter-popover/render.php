<?php
/**
 * Filter Popover block render.
 *
 * Wraps inner blocks (filter-checkbox + active-filters) in a trigger-button
 * + popover-panel shell. Popover state is owned by the Interactivity API
 * store (`state.isFilterPopoverOpen`); see `store/index.js`.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$panel_id = wp_unique_id( 'jetpack-search-filter-panel-' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-popover' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-jetpack-search-popover-root
	data-wp-on-window--click="actions.onWindowClickClosePopovers"
	data-wp-on-window--keydown="actions.onEscapeClosePopovers"
>
	<button
		type="button"
		class="jetpack-search-filter-popover__trigger"
		aria-haspopup="dialog"
		aria-expanded="false"
		data-wp-bind--aria-expanded="state.isFilterPopoverOpen"
		disabled
		data-wp-bind--disabled="state.isFilterTriggerDisabled"
		aria-controls="<?php echo esc_attr( $panel_id ); ?>"
		data-wp-on--click="actions.toggleFilterPopover"
	>
		<svg class="jetpack-search-filter-popover__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path fill="currentColor" d="M3 6h18v2H3V6Zm3 5h12v2H6v-2Zm3 5h6v2H9v-2Z"/>
		</svg>
		<span class="screen-reader-text"><?php esc_html_e( 'Filter results', 'jetpack-search-pkg' ); ?></span>
		<span
			class="jetpack-search-filter-popover__badge"
			data-wp-bind--hidden="!state.activeFilterCount"
			hidden
		>
			<span
				class="jetpack-search-filter-popover__badge-count"
				data-wp-text="state.activeFilterCount"
			></span>
		</span>
	</button>
	<div
		id="<?php echo esc_attr( $panel_id ); ?>"
		class="jetpack-search-filter-popover__panel"
		role="dialog"
		aria-label="<?php esc_attr_e( 'Filters', 'jetpack-search-pkg' ); ?>"
		data-wp-bind--hidden="!state.isFilterPopoverOpen"
		hidden
	>
		<?php
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
		?>
	</div>
</div>
