<?php
/**
 * Sort Control block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$select_id = wp_unique_id( 'jetpack-search-sort-' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
>
	<label for="<?php echo esc_attr( $select_id ); ?>">
		<?php esc_html_e( 'Sort by', 'jetpack-search-pkg' ); ?>
	</label>
	<select
		id="<?php echo esc_attr( $select_id ); ?>"
		data-wp-bind--value="state.sortOrder"
		data-wp-on--change="actions.onSortChange"
	>
		<option value="relevance"><?php esc_html_e( 'Relevance', 'jetpack-search-pkg' ); ?></option>
		<option value="newest"><?php esc_html_e( 'Newest', 'jetpack-search-pkg' ); ?></option>
		<option value="oldest"><?php esc_html_e( 'Oldest', 'jetpack-search-pkg' ); ?></option>
	</select>
</div>
