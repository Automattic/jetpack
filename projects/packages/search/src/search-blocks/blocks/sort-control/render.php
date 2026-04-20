<?php
/**
 * Sort Control block render.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
>
	<label for="jetpack-search-sort">
		<?php esc_html_e( 'Sort by', 'jetpack-search-pkg' ); ?>
	</label>
	<select
		id="jetpack-search-sort"
		data-wp-bind--value="state.sortOrder"
		data-wp-on--change="actions.onSortChange"
	>
		<option value="relevance"><?php esc_html_e( 'Relevance', 'jetpack-search-pkg' ); ?></option>
		<option value="date"><?php esc_html_e( 'Date (newest)', 'jetpack-search-pkg' ); ?></option>
	</select>
</div>
