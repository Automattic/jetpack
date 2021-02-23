<?php
/**
 * Inline Help FAB icon template.
 */
// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

	// See https://github.com/Automattic/jetpack/blob/41fe374f32d0fa35bb66b4ca492e0b337ee7c6cd/projects/packages/tracking/src/js/tracks-ajax.js#L29.
	$jp_tracking_classname = 'jptracks';
?>

<div class="a8c-faux-inline-help">
	<a data-jptracks-name="<?php echo esc_attr( $args['tracking_event_name'] ); ?>" class="<?php echo esc_attr( $jp_tracking_classname ); ?> a8c-faux-inline-help__button" href="<?php echo esc_url( $args['href'] ); ?>" target="_blank" rel="noopener noreferrer" title="<?php echo esc_attr__( 'Help', 'jetpack' ); ?>">
		<?php echo wp_kses( $args['icon'], $args['svg_allowed'] ); ?>
	</a>
</div>
