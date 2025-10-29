<?php
/**
 * Inline Help FAB icon template.
 *
 * @html-template load_template
 * @html-template-var array{href:string,icon:string,svg_allowed:array} $args
 * @package automattic/jetpack-masterbar
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.
?>

<div class="a8c-faux-inline-help">
	<a class="a8c-faux-inline-help__button" href="<?php echo esc_url( $args['href'] ); ?>" target="_blank" rel="noopener noreferrer" title="<?php echo esc_attr__( 'Help', 'jetpack-masterbar' ); ?>">
		<?php echo wp_kses( $args['icon'], $args['svg_allowed'] ); ?>
	</a>
</div>
