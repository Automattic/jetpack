<?php
/**
 * Inline Help FAB icon template.
 *
 * @package jetpack-masterbar
 */

// @phan-file-suppress PhanUndeclaredGlobalVariable
// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>

<div class="a8c-faux-inline-help">
	<a class="a8c-faux-inline-help__button" href="<?php echo esc_url( $args['href'] ); ?>" target="_blank" rel="noopener noreferrer" title="<?php echo esc_attr__( 'Help', 'jetpack-masterbar' ); ?>">
		<?php echo wp_kses( $args['icon'], $args['svg_allowed'] ); ?>
	</a>
</div>
