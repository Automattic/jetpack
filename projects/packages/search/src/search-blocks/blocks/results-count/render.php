<?php
/**
 * Results Count block render.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<p
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-text="state.resultsCountText"
></p>
